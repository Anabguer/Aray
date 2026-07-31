import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import { sideActivityEnergy } from '@/config/rewardGoal'
import { rewardMatrix, sessionXpFromCorrects } from '@/config/rewardMatrix'
import { useProgress } from '@/progress/ProgressContext'
import { newId } from '@/progress/repository'
import { SideRunShell, prefersReducedMotion, useAnswerFx } from '@/run'
import './money.css'

function isMode(v: string | undefined): v is MoneyPlayMode {
  return v === 'change' || v === 'build' || v === 'spare' || v === 'sum' || v === 'mix'
}

export function MoneyPlayScreen() {
  const { mode: modeParam } = useParams<{ mode: string }>()
  const navigate = useNavigate()
  const { setLastSummary, setLastMode } = useMoneySession()
  const { recordProgress } = useDailyMission()
  const { grantActivityEnergy } = useProgress()
  const lumo = useLumoController('thinking')
  const answerFx = useAnswerFx()
  const seedRef = useRef(Date.now())
  const mode: MoneyPlayMode = isMode(modeParam) ? modeParam : 'mix'
  const queue = useMemo(() => buildMoneyRound(mode, MONEY_ROUND_SIZE, seedRef.current), [mode])

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
  const modesPath = '/missions/mates/money'

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

  useEffect(() => {
    if (question || finishedRef.current) return
    finishedRef.current = true
    setLastSummary({
      mode,
      total: MONEY_ROUND_SIZE,
      correct: correctRef.current,
      bestStreak: bestRef.current,
    })
    if (correctRef.current > 0) {
      recordProgress('money', 1)
      grantActivityEnergy({
        sessionId: newId('money'),
        requestedPoints: sideActivityEnergy.money,
        mode: `money-${mode}`.slice(0, 16),
        correct: correctRef.current,
        wrong: Math.max(0, MONEY_ROUND_SIZE - correctRef.current),
        xpEarned: sessionXpFromCorrects(
          correctRef.current,
          rewardMatrix.money.xpPerCorrect,
        ),
        statsDelta: buildActivityStatsDelta({
          feature: 'money',
          mode,
          correct: correctRef.current,
          total: MONEY_ROUND_SIZE,
          playSeconds: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
        }),
      })
    }
    navigate(`${modesPath}/summary`, { replace: true })
  }, [question, mode, navigate, setLastSummary, recordProgress, grantActivityEnergy])

  if (!isMode(modeParam) || !question) return null

  const hasProgress = index > 0 || correctCount > 0 || built > 0

  function advanceAfter(delay: number) {
    window.setTimeout(() => setIndex((i) => i + 1), delay)
  }

  function markCorrect() {
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
        total={MONEY_ROUND_SIZE}
        hits={correctCount}
        streak={streak}
        lumoState={lumo.state}
        lumoIntensity={lumo.intensity}
        prompt={question.prompt}
        detail={question.kind === 'mcq' ? question.detail : `Llevas ${formatEuro(built)}`}
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
          navigate(modesPath)
        }}
        onCancelExit={() => setExitOpen(false)}
        enterKey={enterKey}
        answers={
          question.kind === 'mcq' ? (
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
          ) : (
            <>
              <div className="side-run-options" role="group">
                {question.coins.map((c, i) => (
                  <button
                    key={`${question.id}-${c}`}
                    type="button"
                    className="answer-btn"
                    disabled={locked}
                    onClick={() => onCoin(c)}
                  >
                    <span className="answer-btn__key" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="answer-btn__value">{COIN_LABEL[c]}</span>
                  </button>
                ))}
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
