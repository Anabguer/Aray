import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  listActiveSpellMisses,
  recordSpellHit,
  recordSpellMiss,
  SPELL_MODE_LABELS,
  SPELL_ROUND_SIZE,
  useSpellSession,
  type SpellPlayMode,
} from '@/spelling'
import { buildRound, spellingMinigameId } from '@/minigames'
import { explainSpellMistake, type SpellExplainCard } from '@/spelling/explain'
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
import './spelling.css'

function isMode(v: string | undefined): v is SpellPlayMode {
  return (
    v === 'missing' ||
    v === 'correct' ||
    v === 'picture' ||
    v === 'intruder' ||
    v === 'complete' ||
    v === 'mix' ||
    v === 'review'
  )
}

/** Hueco visible como un solo «?» (___ o _ → una interrogación, sin rayas sueltas). */
function SpellBlankDetail({ display }: { display: string }) {
  const parts = display.split(/_+/)
  if (parts.length === 1) return <>{display}</>
  const spoken = parts.filter(Boolean).join('…')
  return (
    <div className="spell-blank" aria-label={`Palabra con hueco: ${spoken}`}>
      {parts.map((part, i) => (
        <span key={`blank-${i}`}>
          {part ? <span className="spell-blank__text">{part}</span> : null}
          {i < parts.length - 1 ? (
            <span className="spell-blank__slot" aria-hidden="true">
              ?
            </span>
          ) : null}
        </span>
      ))}
    </div>
  )
}

export function SpellPlayScreen() {
  const { mode: modeParam } = useParams<{ mode: string }>()
  const navigate = useNavigate()
  const { setLastSummary, setLastMode } = useSpellSession()
  const { recordProgress } = useDailyMission()
  const { grantActivityEnergy, playerId } = useProgress()
  const { consumeMissionOfDay } = usePlaySession()
  const pid = playerId ?? 'local'
  const lumo = useLumoController('thinking')
  const answerFx = useAnswerFx()
  const seedRef = useRef(Date.now())
  const mode: SpellPlayMode = isMode(modeParam) ? modeParam : 'mix'
  const queue = useMemo(() => {
    if (mode === 'picture') return []
    const preferMisses = listActiveSpellMisses(pid)
    const round = buildRound(spellingMinigameId(mode), {
      count: SPELL_ROUND_SIZE,
      seed: seedRef.current,
      preferMisses: mode === 'review' ? preferMisses : undefined,
    })
    if (round.kind !== 'spell-mcq') {
      throw new Error(`[spelling] ronda inesperada: ${round.kind}`)
    }
    return round.questions
  }, [mode, pid])

  const [index, setIndex] = useState(0)
  const [locked, setLocked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [showWhy, setShowWhy] = useState(false)
  const [explain, setExplain] = useState<SpellExplainCard | null>(null)
  const [exitOpen, setExitOpen] = useState(false)
  const [enterKey, setEnterKey] = useState(0)
  const [hitFlash, setHitFlash] = useState(false)
  const finishedRef = useRef(false)
  const correctRef = useRef(0)
  const bestRef = useRef(0)
  const streakRef = useRef(0)
  const openedRef = useRef(false)
  const startedAtRef = useRef(Date.now())

  const question = queue[index]
  const modesPath = '/missions/languages/spelling'

  useEffect(() => {
    if (!isMode(modeParam)) navigate(modesPath, { replace: true })
    else if (modeParam === 'picture') navigate(modesPath, { replace: true })
  }, [modeParam, navigate])

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    setLastMode(mode)
    soundEngine.unlock()
    soundEngine.play('activity-open')
  }, [mode, setLastMode])

  useEffect(() => {
    if (mode === 'picture') return
    if (question || finishedRef.current) return
    finish()
  }, [question, mode])

  function finish(opts?: { early?: boolean }) {
    if (finishedRef.current) return
    finishedRef.current = true
    const correct = correctRef.current
    const early = Boolean(opts?.early)
    setLastSummary({
      mode,
      total: early ? Math.max(correct, index) : SPELL_ROUND_SIZE,
      correct,
      bestStreak: bestRef.current,
    })
    if (correct > 0) {
      const units = Math.min(4, correct)
      const full = energyForMissionAttempt('spelling', units, playerId)
      const energy = early ? sideRunEnergyForProgress(full, correct, SPELL_ROUND_SIZE) : full
      const playSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
      const dailyChallenge = consumeMissionOfDay()
      if (!dailyChallenge) recordProgress('spelling', units)
      grantActivityEnergy({
        sessionId: newId('spell'),
        requestedPoints: dailyChallenge ? 0 : energy,
        mode: `spell-${mode}`.slice(0, 16),
        correct,
        wrong: Math.max(0, SPELL_ROUND_SIZE - correct),
        xpEarned: sessionXpFromCorrects(correct, rewardMatrix.spelling.xpPerCorrect),
        claimDailyChallenge: Boolean(dailyChallenge),
        statsDelta: buildActivityStatsDelta({
          feature: 'spelling',
          mode,
          correct,
          total: SPELL_ROUND_SIZE,
          playSeconds,
        }),
      })
    }
    navigate(`${modesPath}/summary`, { replace: true })
  }

  useEffect(() => {
    setPicked(null)
    setShowWhy(false)
    setExplain(null)
    setLocked(false)
    setHitFlash(false)
    answerFx.clearFx()
    setEnterKey((k) => k + 1)
    lumo.setThinking()
  }, [index])

  const waitingAfterMiss =
    question != null && picked !== null && picked !== question.correctIndex

  const onPickRef = useRef<(i: number) => void>(() => {})
  useEffect(() => {
    onPickRef.current = (i: number) => {
      if (!question || locked || waitingAfterMiss || hitFlash) return
      setLocked(true)
      setPicked(i)
      const ok = i === question.correctIndex
      const key = question.targetKey
      if (ok) {
        if (key) recordSpellHit(pid, { key, rule: question.rule })
        soundEngine.play('answer-correct')
        const ns = streakRef.current + 1
        streakRef.current = ns
        bestRef.current = Math.max(bestRef.current, ns)
        correctRef.current += 1
        lumo.reactToAnswer({ correct: true, streak: ns })
        setCorrectCount(correctRef.current)
        setStreak(ns)
        setHitFlash(true)
        answerFx.spawn({ tone: 'hit', optionIndex: i, nextStreak: ns })
        window.setTimeout(() => {
          setPicked(null)
          setShowWhy(false)
          setExplain(null)
          setLocked(false)
          setHitFlash(false)
          answerFx.clearFx()
          setIndex((x) => x + 1)
        }, prefersReducedMotion() ? 700 : 950)
        return
      }

      if (key) recordSpellMiss(pid, { key, rule: question.rule, mode })
      soundEngine.play('answer-wrong')
      streakRef.current = 0
      lumo.reactToAnswer({ correct: false, streak: 0 })
      setStreak(0)
      answerFx.spawn({ tone: 'miss', optionIndex: i, nextStreak: 0 })
      setExplain(
        explainSpellMistake({
          mode: question.mode === 'mix' || question.mode === 'review' ? mode : question.mode,
          rule: question.rule,
          tip: question.tip,
          correct: question.options[question.correctIndex]!,
          chosen: question.options[i]!,
        }),
      )
    }
  })

  useEffect(() => {
    if (!question || mode === 'picture') return
    const optionCount = question.options.length
    function onKey(e: KeyboardEvent) {
      if (locked || waitingAfterMiss || hitFlash || exitOpen) return
      const n = Number(e.key)
      if (!Number.isInteger(n) || n < 1 || n > optionCount) return
      e.preventDefault()
      onPickRef.current(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [question, mode, locked, waitingAfterMiss, hitFlash, exitOpen])

  if (!isMode(modeParam) || mode === 'picture' || !question) return null

  const hasProgress = index > 0 || correctCount > 0 || picked !== null

  function goNext() {
    setPicked(null)
    setShowWhy(false)
    setExplain(null)
    setLocked(false)
    setHitFlash(false)
    answerFx.clearFx()
    setIndex((x) => x + 1)
  }

  function goPrev() {
    if (locked || waitingAfterMiss || hitFlash || index === 0) return
    answerFx.clearFx()
    setIndex((x) => x - 1)
  }

  function requestExit() {
    if (hasProgress) {
      setExitOpen(true)
      return
    }
    navigate(modesPath)
  }

  function onPick(i: number) {
    onPickRef.current(i)
  }
  return (
    <AppShell
      title={SPELL_MODE_LABELS[mode].toUpperCase()}
      shortTitle="Ortografía"
      showBack
      backTo={modesPath}
    >
      <div className="spell-play">
        <SideRunShell
          title={SPELL_MODE_LABELS[mode].toUpperCase()}
          current={index + 1}
          total={SPELL_ROUND_SIZE}
          hits={correctCount}
          streak={streak}
          lumoState={lumo.state}
          lumoIntensity={lumo.intensity}
          prompt={question.prompt}
          extra={question.emoji ? <span aria-hidden="true">{question.emoji}</span> : undefined}
          detail={
            question.display?.includes('_') ? (
              <SpellBlankDetail display={question.display} />
            ) : (
              question.display
            )
          }
          fx={answerFx.fx}
          lumoBoost={answerFx.lumoBoost}
          hit={hitFlash}
          miss={waitingAfterMiss}
          canPrev={index > 0 && !locked && !waitingAfterMiss && !hitFlash}
          onPrev={goPrev}
          exitOpen={exitOpen}
          onExitRequest={requestExit}
          onConfirmExit={() => {
            setExitOpen(false)
            finish({ early: true })
          }}
          onCancelExit={() => setExitOpen(false)}
          enterKey={enterKey}
          answers={
            <div
              className={`side-run-options side-run-options--count-${question.options.length}`}
              role="group"
              aria-label="Respuestas"
            >
              {question.options.map((opt, i) => {
                const isCorrect = i === question.correctIndex
                const isPicked = picked === i
                const mark =
                  picked === null
                    ? ''
                    : isCorrect
                      ? ' is-correct'
                      : isPicked
                        ? ' is-wrong'
                        : ''
                const near =
                  answerFx.fx?.kind === 'near' && answerFx.fx.optionIndex === i
                    ? answerFx.fx
                    : null
                return (
                  <button
                    key={`${question.id}-${i}`}
                    type="button"
                    className={`answer-btn${mark}${near ? ' has-near-fx' : ''}`}
                    disabled={locked || waitingAfterMiss || hitFlash}
                    onClick={() => onPick(i)}
                  >
                    <span className="answer-btn__key" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="answer-btn__value">{opt}</span>
                    {near ? (
                      <span
                        className={`answer-btn__near answer-btn__near--${near.tone}`}
                        role="status"
                      >
                        <span className="answer-btn__near-msg">{near.message}</span>
                        {near.combo != null ? (
                          <span className="answer-btn__near-combo">COMBO ×{near.combo}</span>
                        ) : null}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          }
          footer={
            waitingAfterMiss ? (
              <div className="spell-why" role="region" aria-label="Explicación">
                {!showWhy ? (
                  <div className="spell-why__actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-block"
                      onClick={() => setShowWhy(true)}
                    >
                      ¿Por qué he fallado?
                    </button>
                    <button type="button" className="btn btn-primary btn-block" onClick={goNext}>
                      Seguir
                    </button>
                  </div>
                ) : explain ? (
                  <div className="spell-why__card">
                    <p className="spell-why__badge">{explain.badge}</p>
                    <div className="spell-why__row spell-why__row--bad">
                      <span className="spell-why__icon" aria-hidden="true">
                        ✕
                      </span>
                      <p>{explain.whyWrong}</p>
                    </div>
                    <div className="spell-why__row spell-why__row--ok">
                      <span className="spell-why__icon" aria-hidden="true">
                        ✓
                      </span>
                      <p>{explain.whyRight}</p>
                    </div>
                    <button type="button" className="btn btn-primary btn-block" onClick={goNext}>
                      ¡Ya lo pillo! Seguir
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null
          }
        />
      </div>
    </AppShell>
  )
}
