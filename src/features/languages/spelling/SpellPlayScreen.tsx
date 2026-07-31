import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  buildSpellRound,
  SPELL_MODE_LABELS,
  SPELL_ROUND_SIZE,
  useSpellSession,
  type SpellPlayMode,
} from '@/spelling'
import { AppShell } from '@/components/AppShell'
import { Lumo } from '@/lumo/Lumo'
import { useLumoController } from '@/lumo/useLumoController'
import { soundEngine } from '@/sound/soundEngine'
import { useDailyMission } from '@/daily/DailyMissionContext'
import { sideActivityEnergy } from '@/config/rewardGoal'
import { useProgress } from '@/progress/ProgressContext'
import { newId } from '@/progress/repository'
import './spelling.css'

function isMode(v: string | undefined): v is SpellPlayMode {
  return (
    v === 'missing' ||
    v === 'correct' ||
    v === 'picture' ||
    v === 'intruder' ||
    v === 'complete' ||
    v === 'mix'
  )
}

export function SpellPlayScreen() {
  const { mode: modeParam } = useParams<{ mode: string }>()
  const navigate = useNavigate()
  const { setLastSummary, setLastMode } = useSpellSession()
  const { recordProgress } = useDailyMission()
  const { grantActivityEnergy } = useProgress()
  const lumo = useLumoController('thinking')
  const seedRef = useRef(Date.now())
  const mode: SpellPlayMode = isMode(modeParam) ? modeParam : 'mix'
  const queue = useMemo(() => buildSpellRound(mode, SPELL_ROUND_SIZE, seedRef.current), [mode])

  const [index, setIndex] = useState(0)
  const [locked, setLocked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const finishedRef = useRef(false)
  const correctRef = useRef(0)
  const bestRef = useRef(0)
  const streakRef = useRef(0)
  const openedRef = useRef(false)

  const question = queue[index]

  useEffect(() => {
    if (!isMode(modeParam)) navigate('/missions/languages/spelling', { replace: true })
  }, [modeParam, navigate])

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    setLastMode(mode)
    soundEngine.unlock()
    soundEngine.play('activity-open')
  }, [mode, setLastMode])

  useEffect(() => {
    if (question || finishedRef.current) return
    finishedRef.current = true
    setLastSummary({
      mode,
      total: SPELL_ROUND_SIZE,
      correct: correctRef.current,
      bestStreak: bestRef.current,
    })
    recordProgress('spelling', correctRef.current)
    if (correctRef.current > 0) {
      grantActivityEnergy({
        sessionId: newId('spell'),
        requestedPoints: sideActivityEnergy.spelling,
        mode: `spell-${mode}`.slice(0, 16),
        correct: correctRef.current,
        wrong: Math.max(0, SPELL_ROUND_SIZE - correctRef.current),
      })
    }
    navigate('/missions/languages/spelling/summary', { replace: true })
  }, [question, mode, navigate, setLastSummary, recordProgress, grantActivityEnergy])

  if (!isMode(modeParam) || !question) return null

  function onPick(i: number) {
    if (locked) return
    setLocked(true)
    const ok = i === question.correctIndex
    if (ok) {
      soundEngine.play('correct')
      const ns = streakRef.current + 1
      streakRef.current = ns
      bestRef.current = Math.max(bestRef.current, ns)
      correctRef.current += 1
      lumo.reactToAnswer({ correct: true, streak: ns })
      setCorrectCount(correctRef.current)
      setStreak(ns)
      setBestStreak(bestRef.current)
    } else {
      soundEngine.play('wrong')
      streakRef.current = 0
      lumo.reactToAnswer({ correct: false, streak: 0 })
      setStreak(0)
    }
    window.setTimeout(() => {
      setLocked(false)
      setIndex((x) => x + 1)
    }, ok ? 320 : 520)
  }

  return (
    <AppShell
      title={SPELL_MODE_LABELS[mode].toUpperCase()}
      shortTitle="Ortografía"
      showBack
      backTo="/missions/languages/spelling"
    >
      <section className="spell-play">
        <header className="spell-play__hud">
          <Lumo state={lumo.state} intensity={lumo.intensity} size="sm" />
          <p>
            {index + 1}/{SPELL_ROUND_SIZE} · {correctCount} ok · racha {streak}
            {bestStreak > streak ? ` · mejor ${bestStreak}` : ''}
          </p>
        </header>
        <p className="spell-play__prompt">{question.prompt}</p>
        {question.emoji ? <p className="spell-play__emoji">{question.emoji}</p> : null}
        {question.display ? <p className="spell-play__display">{question.display}</p> : null}
        <div className="spell-play__options">
          {question.options.map((opt, i) => (
            <button
              key={`${question.id}-${i}`}
              type="button"
              className="spell-play__btn"
              disabled={locked}
              onClick={() => onPick(i)}
            >
              {opt}
            </button>
          ))}
        </div>
      </section>
    </AppShell>
  )
}
