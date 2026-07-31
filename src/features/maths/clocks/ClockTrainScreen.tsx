import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnalogClock } from '@/components/AnalogClock'
import { AppShell } from '@/components/AppShell'
import { QuizArena } from '@/components/quiz/QuizArena'
import { buildTrainQueue } from '@/clock/generator'
import { useClockSession } from '@/clock/ClockSessionContext'
import { useLumoController } from '@/lumo/useLumoController'
import { soundEngine } from '@/sound/soundEngine'
import { useDailyMission } from '@/daily/DailyMissionContext'
import { sideActivityEnergy } from '@/config/rewardGoal'
import { useProgress } from '@/progress/ProgressContext'
import { newId } from '@/progress/repository'

const TRAIN_COUNT = 10

export function ClockTrainScreen() {
  const navigate = useNavigate()
  const { lang, setLastSummary } = useClockSession()
  const { recordProgress } = useDailyMission()
  const { grantActivityEnergy } = useProgress()
  const lumo = useLumoController('thinking')
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
  const openedRef = useRef(false)

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
      correct: correctCount,
      bestStreak,
    })
    recordProgress('clocks', correctCount > 0 ? 2 : 0)
    if (correctCount > 0) {
      grantActivityEnergy({
        sessionId: newId('clock'),
        requestedPoints: sideActivityEnergy.clocks,
        mode: 'clocks-train',
        correct: correctCount,
        wrong: Math.max(0, TRAIN_COUNT - correctCount),
      })
    }
    navigate('/missions/mates/clocks/summary', { replace: true })
  }, [
    question,
    correctCount,
    bestStreak,
    lang,
    navigate,
    setLastSummary,
    recordProgress,
    grantActivityEnergy,
  ])

  if (!question) return null

  function onPick(optionIndex: number) {
    if (locked || !question) return
    setLocked(true)
    setSelected(optionIndex)
    const ok = optionIndex === question.correctIndex
    if (ok) {
      soundEngine.play('correct')
      lumo.reactToAnswer({ correct: true, streak: streak + 1 })
      setCorrectCount((c) => c + 1)
      setStreak((s) => {
        const next = s + 1
        setBestStreak((b) => Math.max(b, next))
        return next
      })
      setFeedback(lang === 'ca' ? 'Molt bé!' : '¡Bien!')
    } else {
      soundEngine.play('wrong')
      lumo.reactToAnswer({ correct: false, streak: 0 })
      setStreak(0)
      const right = question.options[question.correctIndex]
      setFeedback(
        lang === 'ca'
          ? `Era: ${right}`
          : `Era: ${right}`,
      )
    }
    window.setTimeout(() => {
      setSelected(null)
      setFeedback(null)
      setLocked(false)
      setIndex((i) => i + 1)
    }, ok ? 700 : 1400)
  }

  return (
    <AppShell title="ENTRENA" shortTitle="Entrena" showBack backTo="/missions/mates/clocks">
      <QuizArena
        className="clock-train-arena"
        lumoState={lumo.state}
        lumoIntensity={lumo.intensity}
        hudRight={
          <p>
            {index + 1}/{TRAIN_COUNT} · racha {streak}
            {bestStreak > streak ? ` · mejor ${bestStreak}` : ''}
          </p>
        }
        prompt={lang === 'ca' ? 'Quina hora és?' : '¿Qué hora es?'}
        detail={feedback ?? undefined}
        extra={<AnalogClock time={question.time} size={200} />}
        answersLabel={lang === 'ca' ? 'Tria una resposta' : 'Elige una respuesta'}
        answers={
          <div className="quiz-arena__options" role="group" aria-label="Opciones">
            {question.options.map((opt, i) => {
              const isSel = selected === i
              const isCorrect = i === question.correctIndex
              let mark = ''
              if (selected != null && isSel && isCorrect) mark = ' is-ok'
              if (selected != null && isSel && !isCorrect) mark = ' is-bad'
              if (selected != null && !isSel && isCorrect && locked) mark = ' is-ok'
              return (
                <button
                  key={`${question.id}-${i}`}
                  type="button"
                  className={`quiz-arena__btn${mark}`}
                  disabled={locked}
                  onClick={() => onPick(i)}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        }
      />
    </AppShell>
  )
}
