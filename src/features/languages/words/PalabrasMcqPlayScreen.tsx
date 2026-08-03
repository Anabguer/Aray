import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { useLumoController } from '@/lumo/useLumoController'
import {
  buildPalabrasMcqRound,
  isPalabrasMcqProductId,
  PALABRAS_MCQ_LABELS,
  PALABRAS_MCQ_ROUND_SIZE,
  type PalabrasMcqProductId,
  type PalabrasMcqQuestion,
  type PalabrasRoundItem,
} from '@/minigames/adapters/palabrasMcq'
import {
  rightLabelFor,
  type PalabrasMatchBoard,
} from '@/minigames/adapters/palabrasMatch'
import { SideRunShell, prefersReducedMotion, useAnswerFx } from '@/run'
import { soundEngine } from '@/sound/soundEngine'
import './palabras-mcq.css'

const WORDS_PATH = '/missions/languages/words'

export function PalabrasMcqPlayScreen() {
  const { productId: rawId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const productId: PalabrasMcqProductId | null = isPalabrasMcqProductId(rawId ?? '')
    ? (rawId as PalabrasMcqProductId)
    : null

  const lumo = useLumoController('thinking')
  const answerFx = useAnswerFx()
  const seedRef = useRef(Date.now())
  const finishedRef = useRef(false)
  const correctRef = useRef(0)
  const streakRef = useRef(0)
  const bestRef = useRef(0)
  const openedRef = useRef(false)

  const queue = useMemo(() => {
    if (!productId) return []
    return buildPalabrasMcqRound(productId, PALABRAS_MCQ_ROUND_SIZE, seedRef.current)
  }, [productId])

  const [index, setIndex] = useState(0)
  const [locked, setLocked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [exitOpen, setExitOpen] = useState(false)
  const [enterKey, setEnterKey] = useState(0)
  const [hitFlash, setHitFlash] = useState(false)

  // Match state
  const [selLeft, setSelLeft] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrongRight, setWrongRight] = useState<string | null>(null)

  const item: PalabrasRoundItem | undefined = queue[index]
  const label = productId ? PALABRAS_MCQ_LABELS[productId] : 'Palabras'

  useEffect(() => {
    if (!productId) navigate(WORDS_PATH, { replace: true })
  }, [productId, navigate])

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    soundEngine.unlock()
    soundEngine.play('activity-open')
  }, [])

  function finish(opts?: { early?: boolean }) {
    if (finishedRef.current || !productId) return
    finishedRef.current = true
    const correct = correctRef.current
    const early = Boolean(opts?.early)
    navigate(`/missions/languages/words/${productId}/summary`, {
      replace: true,
      state: {
        correct,
        total: early ? Math.max(correct, index) : PALABRAS_MCQ_ROUND_SIZE,
        title: label,
        productId,
      },
    })
  }

  useEffect(() => {
    if (!productId) return
    if (item || finishedRef.current) return
    finish()
  }, [item, productId])

  useEffect(() => {
    setPicked(null)
    setLocked(false)
    setHitFlash(false)
    setSelLeft(null)
    setMatched(new Set())
    setWrongRight(null)
    answerFx.clearFx()
    setEnterKey((k) => k + 1)
    lumo.setThinking()
  }, [index])

  const question = item?.format === 'mcq' ? (item as PalabrasMcqQuestion) : null
  const board = item?.format === 'match' ? (item as PalabrasMatchBoard) : null

  const waitingAfterMiss =
    question != null && picked !== null && picked !== question.correctIndex

  const onPickRef = useRef<(i: number) => void>(() => {})
  useEffect(() => {
    onPickRef.current = (i: number) => {
      if (!question || locked || waitingAfterMiss || hitFlash) return
      setLocked(true)
      setPicked(i)
      const ok = i === question.correctIndex
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
        answerFx.spawn({ tone: 'hit', optionIndex: i, nextStreak: ns })
        window.setTimeout(() => {
          setPicked(null)
          setLocked(false)
          setHitFlash(false)
          answerFx.clearFx()
          setIndex((x) => x + 1)
        }, prefersReducedMotion() ? 700 : 950)
        return
      }

      soundEngine.play('answer-wrong')
      streakRef.current = 0
      lumo.reactToAnswer({ correct: false, streak: 0 })
      setStreak(0)
      answerFx.spawn({ tone: 'miss', optionIndex: i, nextStreak: 0 })
    }
  })

  useEffect(() => {
    if (!question) return
    const optionCount = question.options.length
    function onKey(e: KeyboardEvent) {
      if (locked || waitingAfterMiss || hitFlash || exitOpen) return
      const n = Number(e.key)
      if (!Number.isInteger(n) || n < 1 || n > optionCount) return
      e.preventDefault()
      onPickRef.current(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [question, locked, waitingAfterMiss, hitFlash, exitOpen])

  function onMatchLeft(id: string) {
    if (!board || locked || matched.has(id)) return
    setSelLeft((prev) => (prev === id ? null : id))
    setWrongRight(null)
  }

  function onMatchRight(pairId: string) {
    if (!board || locked || !selLeft || matched.has(pairId)) return
    if (selLeft === pairId) {
      soundEngine.play('answer-correct')
      const next = new Set(matched)
      next.add(pairId)
      setMatched(next)
      setSelLeft(null)
      const ns = streakRef.current + 1
      streakRef.current = ns
      bestRef.current = Math.max(bestRef.current, ns)
      setStreak(ns)
      lumo.reactToAnswer({ correct: true, streak: ns })
      if (next.size >= board.left.length) {
        correctRef.current += 1
        setCorrectCount(correctRef.current)
        setLocked(true)
        setHitFlash(true)
        window.setTimeout(() => {
          setLocked(false)
          setHitFlash(false)
          setIndex((x) => x + 1)
        }, prefersReducedMotion() ? 700 : 900)
      }
      return
    }
    soundEngine.play('answer-wrong')
    streakRef.current = 0
    setStreak(0)
    lumo.reactToAnswer({ correct: false, streak: 0 })
    setWrongRight(pairId)
    setLocked(true)
    window.setTimeout(() => {
      setWrongRight(null)
      setSelLeft(null)
      setLocked(false)
    }, 480)
  }

  if (!productId || !item) return null

  const hasProgress = index > 0 || correctCount > 0 || picked !== null || matched.size > 0

  function goNext() {
    setPicked(null)
    setLocked(false)
    setHitFlash(false)
    answerFx.clearFx()
    setIndex((x) => x + 1)
  }

  function goPrev() {
    if (locked || waitingAfterMiss || hitFlash || index === 0) return
    answerFx.clearFx()
    setIndex((x) => x - 1)
  }

  function requestExit() {
    if (hasProgress) {
      setExitOpen(true)
      return
    }
    navigate(WORDS_PATH)
  }

  const prompt = question?.prompt ?? board?.prompt ?? ''
  const helpText = question?.tip ?? board?.help ?? null

  return (
    <AppShell title={label.toUpperCase()} shortTitle="Palabras" showBack backTo={WORDS_PATH}>
      <div className="palabras-mcq-play">
        <SideRunShell
          title={label.toUpperCase()}
          current={index + 1}
          total={PALABRAS_MCQ_ROUND_SIZE}
          hits={correctCount}
          streak={streak}
          lumoState={lumo.state}
          lumoIntensity={lumo.intensity}
          prompt={prompt}
          fx={answerFx.fx}
          lumoBoost={answerFx.lumoBoost}
          hit={hitFlash}
          miss={waitingAfterMiss}
          canPrev={index > 0 && !locked && !waitingAfterMiss && !hitFlash}
          onPrev={goPrev}
          exitOpen={exitOpen}
          onExitRequest={requestExit}
          onConfirmExit={() => {
            setExitOpen(false)
            finish({ early: true })
          }}
          onCancelExit={() => setExitOpen(false)}
          enterKey={enterKey}
          answers={
            question ? (
              <div
                className={`side-run-options side-run-options--count-${question.options.length}`}
                role="group"
                aria-label="Respuestas"
              >
                {question.options.map((opt, i) => {
                  const isCorrect = i === question.correctIndex
                  const isPicked = picked === i
                  const mark =
                    picked === null
                      ? ''
                      : isCorrect
                        ? ' is-correct'
                        : isPicked
                          ? ' is-wrong'
                          : ''
                  const near =
                    answerFx.fx?.kind === 'near' && answerFx.fx.optionIndex === i
                      ? answerFx.fx
                      : null
                  return (
                    <button
                      key={`${question.id}-${i}`}
                      type="button"
                      className={`answer-btn${mark}${near ? ' has-near-fx' : ''}`}
                      disabled={locked || waitingAfterMiss || hitFlash}
                      onClick={() => onPickRef.current(i)}
                    >
                      <span className="answer-btn__key" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span className="answer-btn__value">{opt}</span>
                      {near ? (
                        <span
                          className={`answer-btn__near answer-btn__near--${near.tone}`}
                          role="status"
                        >
                          <span className="answer-btn__near-msg">{near.message}</span>
                          {near.combo != null ? (
                            <span className="answer-btn__near-combo">COMBO ×{near.combo}</span>
                          ) : null}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            ) : board ? (
              <div className="palabras-match" role="group" aria-label="Empareja">
                <div className="palabras-match__cols">
                  <ul className="palabras-match__col" aria-label="Palabras">
                    {board.left.map((p) => (
                      <li key={`L-${p.id}`}>
                        <button
                          type="button"
                          className={`answer-btn palabras-match__chip${selLeft === p.id ? ' is-selected' : ''}${matched.has(p.id) ? ' is-done' : ''}`}
                          disabled={locked || matched.has(p.id)}
                          onClick={() => onMatchLeft(p.id)}
                        >
                          <span className="answer-btn__value">{p.left}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <ul className="palabras-match__col" aria-label="Parejas">
                    {board.rightOrder.map((pid) => (
                      <li key={`R-${pid}`}>
                        <button
                          type="button"
                          className={`answer-btn palabras-match__chip${wrongRight === pid ? ' is-wrong' : ''}${matched.has(pid) ? ' is-done' : ''}${selLeft ? ' is-target' : ''}`}
                          disabled={locked || matched.has(pid) || !selLeft}
                          onClick={() => onMatchRight(pid)}
                        >
                          <span className="answer-btn__value">{rightLabelFor(board, pid)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="palabras-match__hint">
                  {selLeft ? 'Ahora toca la pareja' : 'Toca una palabra de la izquierda'}
                </p>
              </div>
            ) : null
          }
          footer={
            <>
              {helpText && !waitingAfterMiss ? (
                <p className="palabras-mcq-why__tip" role="note">
                  {helpText}
                </p>
              ) : null}
              {waitingAfterMiss ? (
                <div className="palabras-mcq-why" role="region" aria-label="Ayuda">
                  <p className="palabras-mcq-why__ok">
                    La respuesta es «{question!.options[question!.correctIndex]}».
                  </p>
                  {question!.tip ? (
                    <p className="palabras-mcq-why__tip">
                      <strong>Recuerda:</strong> {question!.tip}
                    </p>
                  ) : null}
                  <button type="button" className="btn btn-primary btn-block" onClick={goNext}>
                    Seguir
                  </button>
                </div>
              ) : null}
            </>
          }
        />
      </div>
    </AppShell>
  )
}
