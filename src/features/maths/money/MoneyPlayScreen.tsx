import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  buildMoneyRound,
  COIN_LABEL,
  formatEuro,
  MONEY_MODE_LABELS,
  MONEY_ROUND_SIZE,
  useMoneySession,
  type CoinEuro,
  type MoneyPlayMode,
  type MoneyQuestion,
} from '@/money'
import { AppShell } from '@/components/AppShell'
import { useLumoController } from '@/lumo/useLumoController'
import { soundEngine } from '@/sound/soundEngine'
import { useDailyMission } from '@/daily/DailyMissionContext'
import { buildActivityStatsDelta } from '@/achievements/stats'
import { energyForMissionAttempt } from '@/daily/missionEnergy'
import { rewardMatrix, sessionXpFromCorrects } from '@/config/rewardMatrix'
import { useProgress } from '@/progress/ProgressContext'
import { usePlaySession } from '@/progress/PlayContext'
import { newId } from '@/progress/repository'
import { SideRunShell, prefersReducedMotion, useAnswerFx } from '@/run'
import { sideRunEnergyForProgress } from '@/reward/sideRunSettle'
import { buildMoneyMissPayload, moneyQuestionId } from '@/math/missIds'
import {
  listActiveMathsMisses,
  rebuildMoneyFromMiss,
  recordMathsHit,
  recordMathsMiss,
} from '@/math/missStore'
import {
  MoneyPiecesBoard,
  MoneyPieceFace,
  coinFromLabel,
  pieceFromCents,
  pieceLabel,
} from '@/features/maths/money/MoneyPiecesBoard'
import './money.css'

function isMode(v: string | undefined): v is MoneyPlayMode | 'misses' {
  return (
    v === 'change' ||
    v === 'build' ||
    v === 'spare' ||
    v === 'sum' ||
    v === 'shortfall' ||
    v === 'mix' ||
    v === 'misses'
  )
}

export function MoneyPlayScreen() {
  const { mode: modeParam } = useParams<{ mode: string }>()
  const navigate = useNavigate()
  const { setLastSummary, setLastMode } = useMoneySession()
  const { recordProgress } = useDailyMission()
  const { grantActivityEnergy, playerId } = useProgress()
  const { consumeMissionOfDay } = usePlaySession()
  const lumo = useLumoController('thinking')
  const answerFx = useAnswerFx()
  const seedRef = useRef(Date.now())
  const mode: MoneyPlayMode | 'misses' = isMode(modeParam) ? modeParam : 'mix'
  const isMisses = mode === 'misses'
  const pid = playerId ?? 'local'
  const modesPath = '/missions/mates/money'

  const queue = useMemo(() => {
    if (isMisses) {
      return listActiveMathsMisses(pid, 'money').map(rebuildMoneyFromMiss)
    }
    return buildMoneyRound(mode, MONEY_ROUND_SIZE, seedRef.current)
  }, [mode, isMisses, pid])

  const roundSize = isMisses ? Math.max(1, queue.length) : MONEY_ROUND_SIZE

  const [index, setIndex] = useState(0)
  const [locked, setLocked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [built, setBuilt] = useState(0)
  const [pickedCoins, setPickedCoins] = useState<CoinEuro[]>([])
  const [hitFlash, setHitFlash] = useState(false)
  const [missFlash, setMissFlash] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const [enterKey, setEnterKey] = useState(0)
  const finishedRef = useRef(false)
  const correctRef = useRef(0)
  const bestRef = useRef(0)
  const streakRef = useRef(0)
  const openedRef = useRef(false)
  const startedAtRef = useRef(Date.now())

  const question = queue[index] as MoneyQuestion | undefined

  useEffect(() => {
    if (!isMode(modeParam)) navigate(modesPath, { replace: true })
  }, [modeParam, navigate])

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    setLastMode(mode)
    soundEngine.unlock()
    soundEngine.play('activity-open')
  }, [mode, setLastMode])

  useEffect(() => {
    setBuilt(0)
    setPickedCoins([])
    setLocked(false)
    setHitFlash(false)
    setMissFlash(false)
    answerFx.clearFx()
    setEnterKey((k) => k + 1)
    lumo.setThinking()
  }, [index])

  function finish(opts?: { early?: boolean }) {
    if (finishedRef.current) return
    finishedRef.current = true
    const correct = correctRef.current
    const early = Boolean(opts?.early)
    setLastSummary({
      mode,
      total: early ? Math.max(correct, index) : roundSize,
      correct,
      bestStreak: bestRef.current,
    })
    if (correct > 0) {
      const full = energyForMissionAttempt('money', 1, playerId)
      const energy = early ? sideRunEnergyForProgress(full, correct, roundSize) : full
      const dailyChallenge = consumeMissionOfDay()
      if (!dailyChallenge) recordProgress('money', 1)
      grantActivityEnergy({
        sessionId: newId('money'),
        requestedPoints: dailyChallenge ? 0 : energy,
        mode: `money-${mode}`.slice(0, 16),
        correct,
        wrong: Math.max(0, roundSize - correct),
        xpEarned: sessionXpFromCorrects(correct, rewardMatrix.money.xpPerCorrect),
        claimDailyChallenge: Boolean(dailyChallenge),
        statsDelta: buildActivityStatsDelta({
          feature: 'money',
          mode: isMisses ? 'mix' : mode,
          correct,
          total: roundSize,
          playSeconds: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
        }),
      })
    }
    navigate(`${modesPath}/summary`, { replace: true })
  }

  useEffect(() => {
    if (question || finishedRef.current) return
    if (isMisses && queue.length === 0) return
    finish()
  }, [question])

  if (!isMode(modeParam)) return null

  if (isMisses && queue.length === 0) {
    return (
      <AppShell title="MIS FALLOS" shortTitle="Fallos" showBack backTo={modesPath}>
        <section className="side-run" style={{ padding: '1.5rem' }}>
          <p className="play-banner play-banner--info">
            ¡Repaso limpio! No tienes errores pendientes.
          </p>
          <Link to={modesPath} className="btn btn-primary">
            Volver a Dinero
          </Link>
        </section>
      </AppShell>
    )
  }

  if (!question) return null

  const hasProgress = index > 0 || correctCount > 0 || built > 0

  function advanceAfter(delay: number) {
    window.setTimeout(() => setIndex((i) => i + 1), delay)
  }

  function markCorrect() {
    recordMathsHit(pid, moneyQuestionId(question!))
    soundEngine.play('answer-correct')
    const ns = streakRef.current + 1
    streakRef.current = ns
    bestRef.current = Math.max(bestRef.current, ns)
    correctRef.current += 1
    lumo.reactToAnswer({ correct: true, streak: ns })
    setCorrectCount(correctRef.current)
    setStreak(ns)
    setLocked(true)
    setHitFlash(true)
    answerFx.spawn({ tone: 'hit', nextStreak: ns })
    advanceAfter(prefersReducedMotion() ? 700 : 950)
  }

  function markWrong() {
    recordMathsMiss(pid, buildMoneyMissPayload(question!))
    soundEngine.play('answer-wrong')
    streakRef.current = 0
    lumo.reactToAnswer({ correct: false, streak: 0 })
    setStreak(0)
    setLocked(true)
    setMissFlash(true)
    answerFx.spawn({ tone: 'miss', nextStreak: 0 })
    advanceAfter(prefersReducedMotion() ? 700 : 900)
  }

  function onMcq(i: number) {
    if (locked || !question || question.kind !== 'mcq') return
    if (i === question.correctIndex) markCorrect()
    else markWrong()
  }

  function onCoin(c: CoinEuro) {
    if (locked || !question || question.kind !== 'build') return
    const next = built + c
    const coins = [...pickedCoins, c]
    setBuilt(next)
    setPickedCoins(coins)
    if (next === question.targetCents) {
      markCorrect()
      return
    }
    if (next > question.targetCents) {
      markWrong()
    }
  }

  return (
    <AppShell
      title={MONEY_MODE_LABELS[mode].toUpperCase()}
      shortTitle="Dinero"
      showBack
      backTo={modesPath}
    >
      <SideRunShell
        title={MONEY_MODE_LABELS[mode].toUpperCase()}
        current={index + 1}
        total={roundSize}
        hits={correctCount}
        streak={streak}
        lumoState={lumo.state}
        lumoIntensity={lumo.intensity}
        prompt={question.prompt}
        detail={
          question.kind === 'mcq' ? (
            (question.scene && question.scene.length > 0) ||
            (question.pieces && question.pieces.length > 0) ? (
              <MoneyPiecesBoard
                pieces={question.pieces}
                scene={question.scene}
                caption={question.detail}
              />
            ) : (
              question.detail
            )
          ) : (
            <div className="money-build-detail">
              <p className="money-build-detail__total">Llevas {formatEuro(built)}</p>
              {pickedCoins.length > 0 ? (
                <MoneyPiecesBoard
                  pieces={pickedCoins.map((c) => pieceFromCents(c))}
                  caption={`Piezas: ${pickedCoins.map((c) => COIN_LABEL[c]).join(', ')}`}
                />
              ) : null}
            </div>
          )
        }
        fx={answerFx.fx}
        lumoBoost={answerFx.lumoBoost}
        hit={hitFlash}
        miss={missFlash}
        canPrev={index > 0 && !locked}
        onPrev={() => {
          if (locked || index === 0) return
          setIndex((i) => i - 1)
        }}
        exitOpen={exitOpen}
        onExitRequest={() => (hasProgress ? setExitOpen(true) : navigate(modesPath))}
        onConfirmExit={() => {
          setExitOpen(false)
          finish({ early: true })
        }}
        onCancelExit={() => setExitOpen(false)}
        enterKey={enterKey}
        answers={
          question.kind === 'mcq' ? (
            question.mode === 'spare' ? (
              <div className="money-picks" role="group" aria-label="Monedas">
                {question.options.map((opt, i) => {
                  const coin = coinFromLabel(opt)
                  const piece = coin != null ? pieceFromCents(coin) : null
                  return (
                    <button
                      key={`${question.id}-${i}`}
                      type="button"
                      className="money-pick"
                      disabled={locked}
                      aria-label={opt}
                      onClick={() => onMcq(i)}
                    >
                      {piece ? (
                        <MoneyPieceFace piece={piece} index={i} />
                      ) : (
                        <span className="money-pick__fallback">{opt}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="side-run-options" role="group">
                {question.options.map((opt, i) => (
                  <button
                    key={`${question.id}-${i}`}
                    type="button"
                    className="answer-btn"
                    disabled={locked}
                    onClick={() => onMcq(i)}
                  >
                    <span className="answer-btn__key" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="answer-btn__value">{opt}</span>
                  </button>
                ))}
              </div>
            )
          ) : (
            <>
              <div className="money-picks" role="group" aria-label="Elige monedas o billetes">
                {question.coins.map((c, i) => {
                  const piece = pieceFromCents(c)
                  return (
                    <button
                      key={`${question.id}-${c}`}
                      type="button"
                      className="money-pick"
                      disabled={locked}
                      aria-label={pieceLabel(piece)}
                      onClick={() => onCoin(c)}
                    >
                      <MoneyPieceFace piece={piece} index={i} />
                    </button>
                  )
                })}
              </div>
              <div style={{ marginTop: '0.55rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-block"
                  disabled={locked || built === 0}
                  onClick={() => {
                    setBuilt(0)
                    setPickedCoins([])
                  }}
                >
                  Reiniciar monedas
                </button>
              </div>
            </>
          )
        }
      />
    </AppShell>
  )
}
