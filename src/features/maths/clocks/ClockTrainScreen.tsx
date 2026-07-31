import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnalogClock } from '@/components/AnalogClock'
import { AppShell } from '@/components/AppShell'
import { buildTrainQueue } from '@/clock/generator'
import { useClockSession } from '@/clock/ClockSessionContext'
import { Lumo } from '@/lumo/Lumo'
import { useLumoController } from '@/lumo/useLumoController'
import { soundEngine } from '@/sound/soundEngine'

const TRAIN_COUNT = 10

export function ClockTrainScreen() {
  const navigate = useNavigate()
  const { lang, setLastSummary } = useClockSession()
  const lumo = useLumoController('thinking')
  const seedRef = useRef(Date.now())

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
    if (!question) {
      setLastSummary({
        mode: 'train',
        lang,
        total: TRAIN_COUNT,
        correct: correctCount,
        bestStreak,
      })
      navigate('/missions/mates/clocks/summary', { replace: true })
    }
  }, [question, correctCount, bestStreak, lang, navigate, setLastSummary])

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
    <AppShell title="ENTRENA" shortTitle="Entrena" showBack backTo="/missions/mates/clocks/modes">
      <section className="clock-train" aria-label="Entrena horas">
        <header className="clock-train__hud">
          <p className="clock-train__count">
            {index + 1} / {TRAIN_COUNT}
          </p>
          <p className="clock-train__streak" aria-live="polite">
            Racha {streak}
          </p>
        </header>

        <div className="clock-train__stage">
          <div className="clock-train__lumo">
            <Lumo state={lumo.state} intensity={lumo.intensity} size="sm" />
          </div>
          <AnalogClock time={question.time} size={220} />
          <p className="clock-train__prompt">
            {lang === 'ca' ? 'Quina hora és?' : '¿Qué hora es?'}
          </p>
        </div>

        <div className="clock-train__options" role="group" aria-label="Opciones">
          {question.options.map((opt, i) => {
            const isSel = selected === i
            const isCorrect = i === question.correctIndex
            let cls = 'clock-train__option'
            if (selected != null && isSel && isCorrect) cls += ' is-ok'
            if (selected != null && isSel && !isCorrect) cls += ' is-bad'
            if (selected != null && !isSel && isCorrect && locked) cls += ' is-reveal'
            return (
              <button
                key={`${question.id}-${i}`}
                type="button"
                className={cls}
                disabled={locked}
                onClick={() => onPick(i)}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {feedback ? (
          <p className="clock-train__feedback" role="status">
            {feedback}
          </p>
        ) : null}
      </section>
    </AppShell>
  )
}
