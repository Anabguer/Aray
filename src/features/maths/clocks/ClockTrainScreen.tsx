import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnalogClock } from '@/components/AnalogClock'
import { AppShell } from '@/components/AppShell'
import { buildTrainQueue } from '@/clock/generator'
import { useClockSession } from '@/clock/ClockSessionContext'
import { useLumoController } from '@/lumo/useLumoController'
import { soundEngine } from '@/sound/soundEngine'
import { useDailyMission } from '@/daily/DailyMissionContext'
import { sideActivityEnergy } from '@/config/rewardGoal'
import { rewardMatrix, sessionXpFromCorrects } from '@/config/rewardMatrix'
import { useProgress } from '@/progress/ProgressContext'
import { newId } from '@/progress/repository'
import { SideRunShell, prefersReducedMotion, useAnswerFx } from '@/run'

const TRAIN_COUNT = 10
const MODES_PATH = '/missions/mates/clocks'

export function ClockTrainScreen() {
  const navigate = useNavigate()
  const { lang, setLastSummary } = useClockSession()
  const { recordProgress } = useDailyMission()
  const { grantActivityEnergy } = useProgress()
  const lumo = useLumoController('thinking')
  const answerFx = useAnswerFx()
  const seedRef = useRef(Date.now())
  const finishedRef = useRef(false)

  const queue = useMemo(
    () => buildTrainQueue(lang, TRAIN_COUNT, seedRef.current),
    [lang],
  )

  const [index, setIndex] = useState(0)
  const [locked, setLocked] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
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
    finishedRef.current = true
    setLastSummary({
      mode: 'train',
      lang,
      total: TRAIN_COUNT,
      correct: correctRef.current,
      bestStreak: bestRef.current,
    })
    recordProgress('clocks', correctRef.current > 0 ? 2 : 0)
    if (correctRef.current > 0) {
      grantActivityEnergy({
        sessionId: newId('clock'),
        requestedPoints: sideActivityEnergy.clocks,
        mode: 'clocks-train',
        correct: correctRef.current,
        wrong: Math.max(0, TRAIN_COUNT - correctRef.current),
        xpEarned: sessionXpFromCorrects(
          correctRef.current,
          rewardMatrix['clocks-train'].xpPerCorrect,
        ),
      })
    }
    navigate(`${MODES_PATH}/summary`, { replace: true })
  }, [question, lang, navigate, setLastSummary, recordProgress, grantActivityEnergy])

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
      setBestStreak(bestRef.current)
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
        prompt={lang === 'ca' ? 'Quina hora és?' : '¿Qué hora es?'}
        detail={feedback ?? undefined}
        extra={<AnalogClock time={question.time} size={168} />}
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
          navigate(MODES_PATH)
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
