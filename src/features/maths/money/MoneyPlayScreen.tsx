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
import { Lumo } from '@/lumo/Lumo'
import { useLumoController } from '@/lumo/useLumoController'
import { soundEngine } from '@/sound/soundEngine'
import { useDailyMission } from '@/daily/DailyMissionContext'
import './money.css'

function isMode(v: string | undefined): v is MoneyPlayMode {
  return v === 'change' || v === 'build' || v === 'spare' || v === 'sum' || v === 'mix'
}

export function MoneyPlayScreen() {
  const { mode: modeParam } = useParams<{ mode: string }>()
  const navigate = useNavigate()
  const { setLastSummary, setLastMode } = useMoneySession()
  const { recordProgress } = useDailyMission()
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
    if (correctRef.current > 0) recordProgress('money', 1)
    navigate('/missions/mates/money/summary', { replace: true })
  }, [question, mode, navigate, setLastSummary, recordProgress])

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
      <section className="money-play">
        <header className="money-play__hud">
          <Lumo state={lumo.state} intensity={lumo.intensity} size="sm" />
          <p>
            {index + 1}/{MONEY_ROUND_SIZE} · {correctCount} ok · racha {streak}
          </p>
        </header>
        <p className="money-play__prompt">{question.prompt}</p>
        {question.kind === 'mcq' && question.detail ? (
          <p className="money-play__detail">{question.detail}</p>
        ) : null}

        {question.kind === 'mcq' ? (
          <div className="money-play__options">
            {question.options.map((opt, i) => (
              <button
                key={`${question.id}-${i}`}
                type="button"
                className="money-play__btn"
                disabled={locked}
                onClick={() => onMcq(i)}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <>
            <p className="money-play__built">Llevas {formatEuro(built)}</p>
            <div className="money-play__coins">
              {question.coins.map((c) => (
                <button
                  key={`${question.id}-${c}`}
                  type="button"
                  className="money-play__coin"
                  disabled={locked}
                  onClick={() => onCoin(c)}
                >
                  {COIN_LABEL[c]}
                </button>
              ))}
            </div>
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
          </>
        )}
      </section>
    </AppShell>
  )
}
