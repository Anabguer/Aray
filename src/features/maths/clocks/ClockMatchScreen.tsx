import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnalogClock } from '@/components/AnalogClock'
import { AppShell } from '@/components/AppShell'
import { buildMatchPairs, shuffleLabels } from '@/clock/generator'
import { useClockSession } from '@/clock/ClockSessionContext'
import { Lumo } from '@/lumo/Lumo'
import { useLumoController } from '@/lumo/useLumoController'
import { soundEngine } from '@/sound/soundEngine'
import { useDailyMission } from '@/daily/DailyMissionContext'
import { sideActivityEnergy } from '@/config/rewardGoal'
import { useProgress } from '@/progress/ProgressContext'
import { newId } from '@/progress/repository'

const PAIRS = 4

export function ClockMatchScreen() {
  const navigate = useNavigate()
  const { lang, setLastSummary } = useClockSession()
  const { recordProgress } = useDailyMission()
  const { grantActivityEnergy } = useProgress()
  const lumo = useLumoController('thinking')
  const seedRef = useRef(Date.now())
  const finishedRef = useRef(false)

  const pairs = useMemo(
    () => buildMatchPairs(lang, PAIRS, seedRef.current),
    [lang],
  )
  const labels = useMemo(
    () => shuffleLabels(pairs, seedRef.current + 17),
    [pairs],
  )

  const [selectedClockId, setSelectedClockId] = useState<string | null>(null)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(() => new Set())
  const [matchedLabels, setMatchedLabels] = useState<Set<string>>(() => new Set())
  const [wrongFlash, setWrongFlash] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [busy, setBusy] = useState(false)
  const openedRef = useRef(false)

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    soundEngine.unlock()
    soundEngine.play('activity-open')
  }, [])

  useEffect(() => {
    if (matched.size < PAIRS || finishedRef.current) return
    finishedRef.current = true
    setLastSummary({
      mode: 'match',
      lang,
      total: attempts,
      correct,
      bestStreak,
    })
    recordProgress('clocks', correct > 0 ? 2 : 0)
    if (correct > 0) {
      grantActivityEnergy({
        sessionId: newId('clock'),
        requestedPoints: sideActivityEnergy.clocks,
        mode: 'clocks-match',
        correct,
        wrong: Math.max(0, attempts - correct),
      })
    }
    navigate('/missions/mates/clocks/summary', { replace: true })
  }, [
    matched,
    attempts,
    correct,
    bestStreak,
    lang,
    navigate,
    setLastSummary,
    recordProgress,
    grantActivityEnergy,
  ])

  function tryMatch(clockId: string, label: string) {
    if (busy) return
    const pair = pairs.find((p) => p.id === clockId)
    if (!pair) return
    setAttempts((a) => a + 1)
    setBusy(true)
    if (pair.label === label) {
      soundEngine.play('correct')
      lumo.reactToAnswer({ correct: true, streak: streak + 1 })
      setCorrect((c) => c + 1)
      setStreak((s) => {
        const next = s + 1
        setBestStreak((b) => Math.max(b, next))
        return next
      })
      setMatched((prev) => new Set(prev).add(clockId))
      setMatchedLabels((prev) => new Set(prev).add(label))
      setSelectedClockId(null)
      setSelectedLabel(null)
      setBusy(false)
    } else {
      soundEngine.play('wrong')
      lumo.reactToAnswer({ correct: false, streak: 0 })
      setStreak(0)
      setWrongFlash(true)
      window.setTimeout(() => {
        setWrongFlash(false)
        setSelectedClockId(null)
        setSelectedLabel(null)
        setBusy(false)
      }, 480)
    }
  }

  function onClock(id: string) {
    if (matched.has(id) || busy) return
    if (selectedLabel) {
      tryMatch(id, selectedLabel)
      return
    }
    setSelectedClockId(id)
  }

  function onLabel(label: string) {
    if (matchedLabels.has(label) || busy) return
    if (selectedClockId) {
      tryMatch(selectedClockId, label)
      return
    }
    setSelectedLabel(label)
  }

  return (
    <AppShell title="EMPAREJA" shortTitle="Empareja" showBack backTo="/missions/mates/clocks">
      <section className="clock-match" aria-label="Empareja horas">
        <header className="clock-match__hud">
          <Lumo state={lumo.state} intensity={lumo.intensity} size="sm" />
          <p>
            {matched.size} / {PAIRS}
            {wrongFlash ? (
              <span className="clock-match__hint"> · Prueba otra vez</span>
            ) : (
              <span className="clock-match__hint">
                {' '}
                · Elige un reloj y su hora
              </span>
            )}
          </p>
        </header>

        <div className="clock-match__clocks">
          {pairs.map((p) => {
            const done = matched.has(p.id)
            const sel = selectedClockId === p.id
            return (
              <button
                key={p.id}
                type="button"
                className={`clock-match__clock${done ? ' is-done' : ''}${sel ? ' is-sel' : ''}`}
                disabled={done || busy}
                onClick={() => onClock(p.id)}
                aria-label={`Reloj ${p.time.hour}:${String(p.time.minute).padStart(2, '0')}`}
              >
                <AnalogClock time={p.time} size={128} showMarks />
              </button>
            )
          })}
        </div>

        <div className="clock-match__labels" role="group" aria-label="Frases">
          {labels.map((label) => {
            const done = matchedLabels.has(label)
            const sel = selectedLabel === label
            return (
              <button
                key={label}
                type="button"
                className={`clock-match__label${done ? ' is-done' : ''}${sel ? ' is-sel' : ''}`}
                disabled={done || busy}
                onClick={() => onLabel(label)}
              >
                {label}
              </button>
            )
          })}
        </div>
      </section>
    </AppShell>
  )
}
