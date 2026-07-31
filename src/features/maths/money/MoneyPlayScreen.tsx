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
import { QuizArena } from '@/components/quiz/QuizArena'
import { useLumoController } from '@/lumo/useLumoController'
import { soundEngine } from '@/sound/soundEngine'
import { useDailyMission } from '@/daily/DailyMissionContext'
import { sideActivityEnergy } from '@/config/rewardGoal'
import { useProgress } from '@/progress/ProgressContext'
import { newId } from '@/progress/repository'
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
  const seedRef = useRef(Date.now())
  const mode: MoneyPlayMode = isMode(modeParam) ? modeParam : 'mix'
  const queue = useMemo(() => buildMoneyRound(mode, MONEY_ROUND_SIZE, seedRef.current), [mode])

  const [index, setIndex] = useState(0)
  const [locked, setLocked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [built, setBuilt] = useState(0)
  const [pickedCoins, setPickedCoins] = useState<CoinEuro[]>([])
  const finishedRef = useRef(false)
  const correctRef = useRef(0)
  const bestRef = useRef(0)
  const streakRef = useRef(0)
  const openedRef = useRef(false)

  const question = queue[index] as MoneyQuestion | undefined

  useEffect(() => {
    if (!isMode(modeParam)) navigate('/missions/mates/money', { replace: true })
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
      })
    }
    navigate('/missions/mates/money/summary', { replace: true })
  }, [question, mode, navigate, setLastSummary, recordProgress, grantActivityEnergy])

  if (!isMode(modeParam) || !question) return null

  function markCorrect() {
    soundEngine.play('correct')
    const ns = streakRef.current + 1
    streakRef.current = ns
    bestRef.current = Math.max(bestRef.current, ns)
    correctRef.current += 1
    lumo.reactToAnswer({ correct: true, streak: ns })
    setCorrectCount(correctRef.current)
    setStreak(ns)
    setLocked(true)
    window.setTimeout(() => setIndex((i) => i + 1), 350)
  }

  function markWrong() {
    soundEngine.play('wrong')
    streakRef.current = 0
    lumo.reactToAnswer({ correct: false, streak: 0 })
    setStreak(0)
    setLocked(true)
    window.setTimeout(() => setIndex((i) => i + 1), 520)
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
      backTo="/missions/mates/money"
    >
      <QuizArena
        className={locked ? 'is-locked' : ''}
        lumoState={lumo.state}
        lumoIntensity={lumo.intensity}
        hudRight={
          <p>
            {index + 1}/{MONEY_ROUND_SIZE} · {correctCount} ok · racha {streak}
          </p>
        }
        prompt={question.prompt}
        detail={question.kind === 'mcq' ? question.detail : undefined}
        answersLabel={question.kind === 'mcq' ? 'Elige una respuesta' : 'Suma monedas'}
        answers={
          question.kind === 'mcq' ? (
            <div className="quiz-arena__options">
              {question.options.map((opt, i) => (
                <button
                  key={`${question.id}-${i}`}
                  type="button"
                  className="quiz-arena__btn"
                  disabled={locked}
                  onClick={() => onMcq(i)}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <>
              <p className="quiz-arena__built">Llevas {formatEuro(built)}</p>
              <div className="quiz-arena__options quiz-arena__options--coins">
                {question.coins.map((c) => (
                  <button
                    key={`${question.id}-${c}`}
                    type="button"
                    className="quiz-arena__btn"
                    disabled={locked}
                    onClick={() => onCoin(c)}
                  >
                    {COIN_LABEL[c]}
                  </button>
                ))}
              </div>
              <div className="quiz-arena__footer">
                <button
                  type="button"
                  className="btn btn-ghost"
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
