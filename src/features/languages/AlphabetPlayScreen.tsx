import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ALPHABET_ROUND_SIZE,
  buildAlphabetRound,
  isOrderComplete,
  useAlphabetSession,
  type AlphabetPlayMode,
  type AlphabetQuestion,
} from '@/alphabet'
import type { AlphabetAnswerRecord } from '@/alphabet/progress'
import { AppShell } from '@/components/AppShell'
import { useLumoController } from '@/lumo/useLumoController'
import { newId } from '@/progress/repository'
import { useProgress } from '@/progress/ProgressContext'
import { soundEngine } from '@/sound/soundEngine'
import { SideRunShell, prefersReducedMotion, useAnswerFx } from '@/run'

const MODE_TITLES: Record<AlphabetPlayMode, string> = {
  missing: 'LETRA QUE FALTA',
  neighbor: 'SIGUIENTE',
  'order-letters': 'ORDENA LETRAS',
  'order-words': 'ORDENA PALABRAS',
  random: 'RANDOM',
}

const MODES_PATH = '/missions/languages/alphabet'

function isPlayMode(value: string | undefined): value is AlphabetPlayMode {
  return (
    value === 'missing' ||
    value === 'neighbor' ||
    value === 'order-letters' ||
    value === 'order-words' ||
    value === 'random'
  )
}

function promptFor(q: AlphabetQuestion): string {
  switch (q.kind) {
    case 'missing':
      return '¿Qué letra falta?'
    case 'neighbor':
      return q.direction === 'next' ? '¿Cuál va después?' : '¿Cuál va antes?'
    case 'order-letters':
      return q.direction === 'asc'
        ? 'Ordena las letras de la A a la Z'
        : 'Ordena las letras de la Z a la A'
    case 'order-words':
      return q.direction === 'asc'
        ? 'Ordena las palabras de la A a la Z'
        : 'Ordena las palabras de la Z a la A'
  }
}

function focusLetterOf(q: AlphabetQuestion): string | undefined {
  if (q.kind === 'missing' || q.kind === 'neighbor') return q.answer
  if (q.kind === 'order-letters') return q.answer[0]
  return q.answer[0]?.[0]?.toUpperCase()
}

export function AlphabetPlayScreen() {
  const { mode: modeParam } = useParams<{ mode: string }>()
  const navigate = useNavigate()
  const { setLastSummary, setLastMode } = useAlphabetSession()
  const { applyAlphabetSession } = useProgress()
  const lumo = useLumoController('thinking')
  const answerFx = useAnswerFx()
  const seedRef = useRef(Date.now())
  const sessionIdRef = useRef(newId('abc'))
  const answersRef = useRef<AlphabetAnswerRecord[]>([])
  const orderMissedRef = useRef(false)
  const mode: AlphabetPlayMode = isPlayMode(modeParam) ? modeParam : 'missing'

  const queue = useMemo(
    () => buildAlphabetRound(mode, ALPHABET_ROUND_SIZE, seedRef.current),
    [mode],
  )

  const [index, setIndex] = useState(0)
  const [locked, setLocked] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [, setBestStreak] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [shakeId, setShakeId] = useState<string | null>(null)
  const [hitFlash, setHitFlash] = useState(false)
  const [missFlash, setMissFlash] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const [enterKey, setEnterKey] = useState(0)
  const openedRef = useRef(false)
  const finishedRef = useRef(false)
  const bestStreakRef = useRef(0)
  const correctCountRef = useRef(0)
  const wrongCountRef = useRef(0)
  const streakRef = useRef(0)

  const question = queue[index]

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    setLastMode(mode)
    soundEngine.unlock()
    soundEngine.play('activity-open')
  }, [mode, setLastMode])

  useEffect(() => {
    setPicked([])
    setSelected(null)
    setFeedback(null)
    setLocked(false)
    setShakeId(null)
    setHitFlash(false)
    setMissFlash(false)
    orderMissedRef.current = false
    answerFx.clearFx()
    setEnterKey((k) => k + 1)
    lumo.setThinking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  useEffect(() => {
    if (!isPlayMode(modeParam)) {
      navigate(MODES_PATH, { replace: true })
    }
  }, [modeParam, navigate])

  useEffect(() => {
    if (question || finishedRef.current) return
    finishedRef.current = true
    const result = applyAlphabetSession({
      mode,
      answers: answersRef.current,
      sessionId: sessionIdRef.current,
      bestStreakInRound: bestStreakRef.current,
    })
    setLastSummary({
      mode,
      total: ALPHABET_ROUND_SIZE,
      correct: correctCountRef.current,
      wrong: wrongCountRef.current,
      bestStreak: bestStreakRef.current,
      roundScore: result.roundScore,
      xpEarned: result.xpEarned,
      coinsEarned: result.coinsEarned,
      rewardPointsEarned: result.rewardPointsEarned,
      rewardDailyComplete: result.rewardDailyComplete,
      recommendReview: result.recommendReview,
      statusLabel: result.statusLabel,
    })
    navigate(`${MODES_PATH}/summary`, { replace: true })
  }, [question, mode, navigate, setLastSummary, applyAlphabetSession])

  if (!isPlayMode(modeParam)) return null
  if (!question) return null

  const hasProgress = index > 0 || correctCount > 0 || wrongCount > 0

  function pushAnswer(correct: boolean, firstTry: boolean) {
    if (!question) return
    answersRef.current.push({
      questionId: question.id,
      kind: question.kind,
      correct,
      firstTry,
      focusLetter: focusLetterOf(question),
      attemptId: newId('abc-a'),
    })
  }

  function registerCorrect(firstTry = true) {
    soundEngine.play('answer-correct')
    const ns = streakRef.current + 1
    streakRef.current = ns
    lumo.reactToAnswer({ correct: true, streak: ns })
    pushAnswer(true, firstTry)
    setCorrectCount((c) => {
      const next = c + 1
      correctCountRef.current = next
      return next
    })
    setStreak(ns)
    setBestStreak((b) => {
      const best = Math.max(b, ns)
      bestStreakRef.current = best
      return best
    })
    setFeedback('¡Bien!')
    setHitFlash(true)
    answerFx.spawn({ tone: 'hit', nextStreak: ns })
  }

  function registerWrong(message = '¡Casi! Prueba otra') {
    soundEngine.play('answer-wrong')
    streakRef.current = 0
    lumo.reactToAnswer({ correct: false, streak: 0 })
    setStreak(0)
    setWrongCount((w) => {
      const next = w + 1
      wrongCountRef.current = next
      return next
    })
    setFeedback(message)
    setMissFlash(true)
    answerFx.spawn({ tone: 'miss', nextStreak: 0 })
  }

  function advance(delay: number) {
    window.setTimeout(() => {
      setSelected(null)
      setFeedback(null)
      setLocked(false)
      setPicked([])
      setHitFlash(false)
      setMissFlash(false)
      answerFx.clearFx()
      setIndex((i) => i + 1)
    }, delay)
  }

  function onPickOption(value: string) {
    if (locked || !question) return
    if (question.kind !== 'missing' && question.kind !== 'neighbor') return
    setLocked(true)
    setSelected(value)
    const ok = value === question.answer
    if (ok) {
      registerCorrect(true)
      advance(prefersReducedMotion() ? 700 : 950)
    } else {
      pushAnswer(false, true)
      registerWrong('¡Uy! Sigue intentando')
      advance(prefersReducedMotion() ? 800 : 1000)
    }
  }

  function onPickOrderItem(value: string) {
    if (locked || !question) return
    if (question.kind !== 'order-letters' && question.kind !== 'order-words') return
    if (picked.includes(value)) return

    const next = [...picked, value]
    const status = isOrderComplete(next, question.answer)
    if (status === 'wrong') {
      setShakeId(value)
      orderMissedRef.current = true
      registerWrong('¡Uy!')
      setLocked(true)
      window.setTimeout(() => {
        setShakeId(null)
        setFeedback(null)
        setMissFlash(false)
        setLocked(false)
        answerFx.clearFx()
        lumo.setThinking()
      }, prefersReducedMotion() ? 550 : 750)
      return
    }

    setPicked(next)
    if (status === 'correct') {
      setLocked(true)
      registerCorrect(!orderMissedRef.current)
      advance(prefersReducedMotion() ? 700 : 900)
    } else {
      soundEngine.play('ui-click')
    }
  }

  const title = MODE_TITLES[mode]
  const remainingPool =
    question.kind === 'order-letters'
      ? question.letters.filter((l) => !picked.includes(l))
      : question.kind === 'order-words'
        ? question.words.filter((w) => !picked.includes(w))
        : []

  let visual: ReactNode = null
  let detail: ReactNode = feedback
  if (question.kind === 'missing') {
    visual = (
      <div className="alphabet-chain" aria-label="Cadena de letras">
        {question.sequence.map((letter, i) => (
          <span
            key={`${question.id}-seq-${i}`}
            className={letter == null ? 'alphabet-chain__slot is-blank' : 'alphabet-chain__slot'}
          >
            {letter ?? '?'}
          </span>
        ))}
      </div>
    )
    detail = feedback
  } else if (question.kind === 'neighbor') {
    visual = (
      <div className="alphabet-neighbor" aria-label="Letra de Lumo">
        {question.direction === 'prev' ? (
          <>
            <span className="alphabet-neighbor__slot">?</span>
            <span className="alphabet-neighbor__gap" aria-hidden="true">
              →
            </span>
            <span className="alphabet-neighbor__letter">{question.letter}</span>
          </>
        ) : (
          <>
            <span className="alphabet-neighbor__letter">{question.letter}</span>
            <span className="alphabet-neighbor__gap" aria-hidden="true">
              →
            </span>
            <span className="alphabet-neighbor__slot">?</span>
          </>
        )}
      </div>
    )
    detail = feedback
  } else if (picked.length > 0) {
    visual = (
      <ol className="alphabet-picked" aria-label="Tu orden">
        {picked.map((item) => (
          <li key={`picked-${item}`} className="alphabet-picked__item">
            {item}
          </li>
        ))}
      </ol>
    )
    detail = feedback
  }

  return (
    <AppShell title={title} shortTitle="Abc" showBack backTo={MODES_PATH}>
      <SideRunShell
        title={title}
        current={index + 1}
        total={ALPHABET_ROUND_SIZE}
        hits={correctCount}
        streak={streak}
        note={
          <>
            {correctCount} aciertos · fallos {wrongCount}
            {streak >= 2 ? ` · Combo ×${streak}` : ''}
          </>
        }
        lumoState={lumo.state}
        lumoIntensity={lumo.intensity}
        prompt={promptFor(question)}
        extra={visual}
        detail={detail}
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
          question.kind === 'missing' || question.kind === 'neighbor' ? (
            <div className="side-run-options" role="group" aria-label="Letras">
              {question.options.map((opt, i) => {
                const isSel = selected === opt
                const isCorrect = opt === question.answer
                let mark = ''
                if (selected != null && isSel && isCorrect) mark = ' is-correct'
                if (selected != null && isSel && !isCorrect) mark = ' is-wrong'
                return (
                  <button
                    key={`${question.id}-opt-${opt}`}
                    type="button"
                    className={`answer-btn${mark}`}
                    disabled={locked}
                    onClick={() => onPickOption(opt)}
                  >
                    <span className="answer-btn__key" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="answer-btn__value">{opt}</span>
                  </button>
                )
              })}
            </div>
          ) : question.kind === 'order-letters' ? (
            <div className="side-run-options" role="group" aria-label="Letras">
              {remainingPool.map((opt, i) => (
                <button
                  key={`${question.id}-L-${opt}`}
                  type="button"
                  className={`answer-btn${shakeId === opt ? ' is-wrong' : ''}`}
                  disabled={locked}
                  onClick={() => onPickOrderItem(opt)}
                >
                  <span className="answer-btn__key" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="answer-btn__value">{opt}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="side-run-options" role="group" aria-label="Palabras">
              {question.words.map((word, i) => {
                if (picked.includes(word)) return null
                return (
                  <button
                    key={`${question.id}-W-${word}`}
                    type="button"
                    className={`answer-btn${shakeId === word ? ' is-wrong' : ''}`}
                    disabled={locked}
                    onClick={() => onPickOrderItem(word)}
                  >
                    <span className="answer-btn__key" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="answer-btn__value">{word}</span>
                  </button>
                )
              })}
            </div>
          )
        }
      />
    </AppShell>
  )
}
