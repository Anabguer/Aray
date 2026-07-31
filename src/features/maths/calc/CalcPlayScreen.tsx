import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  buildCalcQueue,
  CALC_DURATION_SEC,
  CALC_MODE_LABELS,
  isOrderCorrect,
  useCalcSession,
  type CalcPlayMode,
  type CalcQuestion,
} from '@/calc'
import { AppShell } from '@/components/AppShell'
import { useLumoController } from '@/lumo/useLumoController'
import { soundEngine } from '@/sound/soundEngine'
import { sideActivityEnergy } from '@/config/rewardGoal'
import { rewardMatrix, sessionXpFromCorrects } from '@/config/rewardMatrix'
import { useDailyMission } from '@/daily/DailyMissionContext'
import { useProgress } from '@/progress/ProgressContext'
import { newId } from '@/progress/repository'
import { SideRunShell, prefersReducedMotion, useAnswerFx } from '@/run'

const QUEUE_SIZE = 40
const MODES_PATH = '/missions/mates/calc'

function isPlayMode(value: string | undefined): value is CalcPlayMode {
  return (
    value === 'add' ||
    value === 'sub' ||
    value === 'missing' ||
    value === 'doubles' ||
    value === 'halves' ||
    value === 'near10' ||
    value === 'compare' ||
    value === 'order' ||
    value === 'truefalse' ||
    value === 'mix'
  )
}

export function CalcPlayScreen() {
  const { mode: modeParam } = useParams<{ mode: string }>()
  const navigate = useNavigate()
  const { setLastSummary, setLastMode } = useCalcSession()
  const { recordProgress } = useDailyMission()
  const { grantActivityEnergy } = useProgress()
  const lumo = useLumoController('thinking')
  const answerFx = useAnswerFx()
  const seedRef = useRef(Date.now())
  const mode: CalcPlayMode = isPlayMode(modeParam) ? modeParam : 'mix'

  const queue = useMemo(
    () => buildCalcQueue(mode, QUEUE_SIZE, seedRef.current),
    [mode],
  )

  const [index, setIndex] = useState(0)
  const [remainingMs, setRemainingMs] = useState(CALC_DURATION_SEC * 1000)
  const [locked, setLocked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [picked, setPicked] = useState<number[]>([])
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null)
  const [exitOpen, setExitOpen] = useState(false)
  const [enterKey, setEnterKey] = useState(0)

  const openedRef = useRef(false)
  const finishedRef = useRef(false)
  const correctRef = useRef(0)
  const attemptsRef = useRef(0)
  const bestStreakRef = useRef(0)
  const streakRef = useRef(0)

  const question = queue[index] as CalcQuestion | undefined

  function finish() {
    if (finishedRef.current) return
    finishedRef.current = true
    setLastSummary({
      mode,
      total: attemptsRef.current,
      correct: correctRef.current,
      bestStreak: bestStreakRef.current,
      durationSec: CALC_DURATION_SEC,
    })
    recordProgress('calc', Math.min(5, correctRef.current))
    if (correctRef.current > 0) {
      grantActivityEnergy({
        sessionId: newId('calc'),
        requestedPoints: sideActivityEnergy.calc,
        mode: `calc-${mode}`.slice(0, 16),
        correct: correctRef.current,
        wrong: Math.max(0, attemptsRef.current - correctRef.current),
        xpEarned: sessionXpFromCorrects(
          correctRef.current,
          rewardMatrix.calc.xpPerCorrect,
        ),
      })
    }
    navigate(`${MODES_PATH}/summary`, { replace: true })
  }

  useEffect(() => {
    if (!isPlayMode(modeParam)) {
      navigate(MODES_PATH, { replace: true })
    }
  }, [modeParam, navigate])

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    setLastMode(mode)
    soundEngine.unlock()
    soundEngine.play('activity-open')
  }, [mode, setLastMode])

  useEffect(() => {
    if (finishedRef.current) return
    const started = performance.now()
    const total = CALC_DURATION_SEC * 1000
    let raf = 0
    const tick = () => {
      const left = Math.max(0, total - (performance.now() - started))
      setRemainingMs(left)
      if (left <= 0) {
        finish()
        return
      }
      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    setPicked([])
    setFlash(null)
    setLocked(false)
    answerFx.clearFx()
    setEnterKey((k) => k + 1)
    lumo.setThinking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  useEffect(() => {
    if (!question && !finishedRef.current) finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question])

  function advance() {
    setIndex((i) => i + 1)
  }

  function onCorrect() {
    soundEngine.play('answer-correct')
    const nextStreak = streakRef.current + 1
    streakRef.current = nextStreak
    bestStreakRef.current = Math.max(bestStreakRef.current, nextStreak)
    correctRef.current += 1
    attemptsRef.current += 1
    lumo.reactToAnswer({ correct: true, streak: nextStreak })
    setCorrectCount(correctRef.current)
    setStreak(nextStreak)
    setFlash('ok')
    setLocked(true)
    answerFx.spawn({ tone: 'hit', nextStreak })
    window.setTimeout(() => {
      setLocked(false)
      setFlash(null)
      answerFx.clearFx()
      advance()
    }, prefersReducedMotion() ? 500 : 750)
  }

  function onWrong() {
    soundEngine.play('answer-wrong')
    streakRef.current = 0
    attemptsRef.current += 1
    lumo.reactToAnswer({ correct: false, streak: 0 })
    setStreak(0)
    setFlash('bad')
    setLocked(true)
    answerFx.spawn({ tone: 'miss', nextStreak: 0 })
    window.setTimeout(() => {
      setLocked(false)
      setFlash(null)
      setPicked([])
      answerFx.clearFx()
      advance()
    }, prefersReducedMotion() ? 550 : 800)
  }

  if (!isPlayMode(modeParam) || !question) return null

  const sec = Math.ceil(remainingMs / 1000)
  const hasProgress = correctCount > 0 || attemptsRef.current > 0 || index > 0

  return (
    <AppShell
      title={CALC_MODE_LABELS[mode].toUpperCase()}
      shortTitle="Cálculo"
      showBack
      backTo={MODES_PATH}
    >
      <SideRunShell
        title={CALC_MODE_LABELS[mode].toUpperCase()}
        current={index + 1}
        total={QUEUE_SIZE}
        hits={correctCount}
        streak={streak}
        countLabel={<span className={sec <= 10 ? 'calc-play__timer is-low' : 'calc-play__timer'}>{sec}s</span>}
        note={
          <>
            {correctCount} aciertos · racha {streak}
            {streak >= 2 ? ` · Combo ×${streak}` : ''}
          </>
        }
        lumoState={lumo.state}
        lumoIntensity={lumo.intensity}
        prompt={question.prompt}
        detail={
          question.kind === 'mcq' && question.expression
            ? question.expression
            : question.kind === 'truefalse'
              ? question.expression
              : question.kind === 'order'
                ? picked.length === 0
                  ? 'Toca en orden…'
                  : picked.join(' → ')
                : undefined
        }
        fx={answerFx.fx}
        lumoBoost={answerFx.lumoBoost}
        hit={flash === 'ok'}
        miss={flash === 'bad'}
        canPrev={false}
        exitOpen={exitOpen}
        onExitRequest={() => (hasProgress ? setExitOpen(true) : navigate(MODES_PATH))}
        onConfirmExit={() => {
          setExitOpen(false)
          finish()
        }}
        onCancelExit={() => setExitOpen(false)}
        enterKey={enterKey}
        answers={
          <CalcAnswers
            question={question}
            locked={locked}
            picked={picked}
            onPickMcq={(i) => {
              if (locked || question.kind !== 'mcq') return
              if (i === question.correctIndex) onCorrect()
              else onWrong()
            }}
            onCompare={(side) => {
              if (locked || question.kind !== 'compare') return
              if (side === question.greater) onCorrect()
              else onWrong()
            }}
            onTrueFalse={(value) => {
              if (locked || question.kind !== 'truefalse') return
              if (value === question.isTrue) onCorrect()
              else onWrong()
            }}
            onOrderTap={(n) => {
              if (locked || question.kind !== 'order') return
              if (picked.includes(n)) return
              const next = [...picked, n]
              setPicked(next)
              if (next.length < question.answer.length) return
              if (isOrderCorrect(next, question.answer)) onCorrect()
              else onWrong()
            }}
          />
        }
      />
    </AppShell>
  )
}

function CalcAnswers({
  question,
  locked,
  picked,
  onPickMcq,
  onCompare,
  onTrueFalse,
  onOrderTap,
}: {
  question: CalcQuestion
  locked: boolean
  picked: number[]
  onPickMcq: (i: number) => void
  onCompare: (side: 'left' | 'right') => void
  onTrueFalse: (value: boolean) => void
  onOrderTap: (n: number) => void
}) {
  if (question.kind === 'mcq') {
    return (
      <div className="quiz-arena__options" role="group">
        {question.options.map((opt, i) => (
          <button
            key={`${question.id}-${i}`}
            type="button"
            className="quiz-arena__btn"
            disabled={locked}
            onClick={() => onPickMcq(i)}
          >
            {opt}
          </button>
        ))}
      </div>
    )
  }

  if (question.kind === 'compare') {
    return (
      <div className="quiz-arena__options quiz-arena__options--compare" role="group">
        <button
          type="button"
          className="quiz-arena__btn quiz-arena__btn--big"
          disabled={locked}
          onClick={() => onCompare('left')}
        >
          {question.left}
        </button>
        <span className="quiz-arena__vs" aria-hidden="true">
          vs
        </span>
        <button
          type="button"
          className="quiz-arena__btn quiz-arena__btn--big"
          disabled={locked}
          onClick={() => onCompare('right')}
        >
          {question.right}
        </button>
      </div>
    )
  }

  if (question.kind === 'truefalse') {
    return (
      <div className="quiz-arena__options" role="group">
        <button
          type="button"
          className="quiz-arena__btn quiz-arena__btn--ok"
          disabled={locked}
          onClick={() => onTrueFalse(true)}
        >
          Correcto
        </button>
        <button
          type="button"
          className="quiz-arena__btn quiz-arena__btn--bad"
          disabled={locked}
          onClick={() => onTrueFalse(false)}
        >
          Incorrecto
        </button>
      </div>
    )
  }

  return (
    <div className="quiz-arena__options" role="group">
      {question.items.map((n) => (
        <button
          key={`${question.id}-${n}`}
          type="button"
          className={`quiz-arena__btn${picked.includes(n) ? ' is-picked' : ''}`}
          disabled={locked || picked.includes(n)}
          onClick={() => onOrderTap(n)}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
