import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnalogClock } from '@/components/AnalogClock'
import { AppShell } from '@/components/AppShell'
import { buildTrainQueue } from '@/clock/generator'
import { useClockSession } from '@/clock/ClockSessionContext'
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

const TRAIN_COUNT = 10
const MODES_PATH = '/missions/mates/clocks'

export function ClockTrainScreen() {
  const navigate = useNavigate()
  const { lang, setLastSummary } = useClockSession()
  const { recordProgress } = useDailyMission()
  const { grantActivityEnergy, playerId } = useProgress()
  const { consumeMissionOfDay } = usePlaySession()
  const lumo = useLumoController('thinking')
  const answerFx = useAnswerFx()
  const seedRef = useRef(Date.now())
  const finishedRef = useRef(false)
  const startedAtRef = useRef(Date.now())

  const queue = useMemo(
    () => buildTrainQueue(lang, TRAIN_COUNT, seedRef.current),
    [lang],
  )

  const [index, setIndex] = useState(0)
  const [locked, setLocked] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [hitFlash, setHitFlash] = useState(false)
  const [missFlash, setMissFlash] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const [enterKey, setEnterKey] = useState(0)
  const openedRef = useRef(false)
  const correctRef = useRef(0)
  const streakRef = useRef(0)
  const bestRef = useRef(0)

  const question = queue[index]

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    soundEngine.unlock()
    soundEngine.play('activity-open')
  }, [])

  useEffect(() => {
    if (question || finishedRef.current) return
    finish()
  }, [question])

  function finish(opts?: { early?: boolean }) {
    if (finishedRef.current) return
    finishedRef.current = true
    const correct = correctRef.current
    const early = Boolean(opts?.early)
    setLastSummary({
      mode: 'train',
      lang,
      total: early ? Math.max(correct, index + 1) : TRAIN_COUNT,
      correct,
      bestStreak: bestRef.current,
    })
    if (correct > 0) {
      const full = energyForMissionAttempt('clocks', 2, playerId)
      const energy = early ? sideRunEnergyForProgress(full, correct, TRAIN_COUNT) : full
      const dailyChallenge = consumeMissionOfDay()
      recordProgress('clocks', 2)
      grantActivityEnergy({
        sessionId: newId('clock'),
        requestedPoints: energy,
        mode: 'clocks-train',
        correct,
        wrong: Math.max(0, TRAIN_COUNT - correct),
        xpEarned: sessionXpFromCorrects(correct, rewardMatrix['clocks-train'].xpPerCorrect),
        claimDailyChallenge: Boolean(dailyChallenge),
        statsDelta: buildActivityStatsDelta({
          feature: 'clocks',
          mode: 'train',
          correct,
          total: TRAIN_COUNT,
          playSeconds: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
        }),
      })
    }
    navigate(`${MODES_PATH}/summary`, { replace: true })
  }

  useEffect(() => {
    setSelected(null)
    setFeedback(null)
    setLocked(false)
    setHitFlash(false)
    setMissFlash(false)
    answerFx.clearFx()
    setEnterKey((k) => k + 1)
    lumo.setThinking()
  }, [index])

  if (!question) return null

  const hasProgress = index > 0 || correctCount > 0

  function onPick(optionIndex: number) {
    if (locked || !question) return
    setLocked(true)
    setSelected(optionIndex)
    const ok = optionIndex === question.correctIndex
    if (ok) {
      soundEngine.play('answer-correct')
      const ns = streakRef.current + 1
      streakRef.current = ns
      bestRef.current = Math.max(bestRef.current, ns)
      correctRef.current += 1
      lumo.reactToAnswer({ correct: true, streak: ns })
      setCorrectCount(correctRef.current)
      setStreak(ns)
      setHitFlash(true)
      setFeedback(lang === 'ca' ? 'Molt bé!' : '¡Bien!')
      answerFx.spawn({ tone: 'hit', optionIndex, nextStreak: ns })
    } else {
      soundEngine.play('answer-wrong')
      streakRef.current = 0
      lumo.reactToAnswer({ correct: false, streak: 0 })
      setStreak(0)
      setMissFlash(true)
      const right = question.options[question.correctIndex]
      setFeedback(lang === 'ca' ? `Era: ${right}` : `Era: ${right}`)
      answerFx.spawn({ tone: 'miss', optionIndex, nextStreak: 0 })
    }
    window.setTimeout(
      () => setIndex((i) => i + 1),
      ok
        ? prefersReducedMotion()
          ? 700
          : 950
        : prefersReducedMotion()
          ? 900
          : 1400,
    )
  }

  const isConvert = question.kind === 'convert24'

  return (
    <AppShell title="ENTRENA" shortTitle="Entrena" showBack backTo={MODES_PATH}>
      <SideRunShell
        title="ENTRENA HORAS"
        current={index + 1}
        total={TRAIN_COUNT}
        hits={correctCount}
        streak={streak}
        lumoState={lumo.state}
        lumoIntensity={lumo.intensity}
        prompt={
          isConvert
            ? (question.prompt ?? '¿Cómo se escribe en 24 h?')
            : lang === 'ca'
              ? 'Quina hora és?'
              : '¿Qué hora es?'
        }
        detail={feedback ?? undefined}
        extra={isConvert ? undefined : <AnalogClock time={question.time} size={220} />}
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
        onExitRequest={() => (hasProgress ? setExitOpen(true) : navigate(MODES_PATH))}
        onConfirmExit={() => {
          setExitOpen(false)
          finish({ early: true })
        }}
        onCancelExit={() => setExitOpen(false)}
        enterKey={enterKey}
        answers={
          <div className="side-run-options" role="group" aria-label="Opciones">
            {question.options.map((opt, i) => {
              const isSel = selected === i
              const isCorrect = i === question.correctIndex
              let mark = ''
              if (selected != null && isSel && isCorrect) mark = ' is-correct'
              if (selected != null && isSel && !isCorrect) mark = ' is-wrong'
              if (selected != null && !isSel && isCorrect && locked) mark = ' is-correct'
              return (
                <button
                  key={`${question.id}-${i}`}
                  type="button"
                  className={`answer-btn${mark}`}
                  disabled={locked}
                  onClick={() => onPick(i)}
                >
                  <span className="answer-btn__key" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="answer-btn__value">{opt}</span>
                </button>
              )
            })}
          </div>
        }
      />
    </AppShell>
  )
}
