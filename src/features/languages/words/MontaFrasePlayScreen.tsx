import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import {
  buildMontaFraseRound,
  isOrderCorrect,
  MONTA_FRASE_ROUND_SIZE,
} from '@/minigames/adapters/palabrasMontaFrase'
import { soundEngine } from '@/sound/soundEngine'
import './monta-frase.css'

const WORDS_PATH = '/missions/languages/words'
const SUMMARY_PATH = '/missions/languages/words/monta-frase/summary'

export function MontaFrasePlayScreen() {
  const navigate = useNavigate()
  const seedRef = useRef(Date.now())
  const openedRef = useRef(false)
  const correctRef = useRef(0)

  const queue = useMemo(
    () => buildMontaFraseRound(MONTA_FRASE_ROUND_SIZE, seedRef.current),
    [],
  )

  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string[]>([])
  const [usedPoolIdx, setUsedPoolIdx] = useState<Set<number>>(new Set())
  const [locked, setLocked] = useState(false)
  const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null)
  const [correctCount, setCorrectCount] = useState(0)

  const question = queue[index]

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    soundEngine.unlock()
    soundEngine.play('activity-open')
  }, [])

  const resetItem = useCallback(() => {
    setPicked([])
    setUsedPoolIdx(new Set())
    setLocked(false)
    setFeedback(null)
  }, [])

  useEffect(() => {
    resetItem()
  }, [index, resetItem])

  const finish = useCallback(
    (finalCorrect: number) => {
      navigate(SUMMARY_PATH, {
        replace: true,
        state: {
          correct: finalCorrect,
          total: queue.length,
          title: 'Monta la frase',
        },
      })
    },
    [navigate, queue.length],
  )

  const goNext = useCallback(
    (finalCorrect: number) => {
      const next = index + 1
      if (next >= queue.length) {
        finish(finalCorrect)
        return
      }
      setIndex(next)
    },
    [finish, index, queue.length],
  )

  const check = useCallback(
    (nextPicked: string[]) => {
      if (!question) return
      setLocked(true)
      if (isOrderCorrect(nextPicked, question.tokens)) {
        soundEngine.play('answer-correct')
        setFeedback('ok')
        const n = correctRef.current + 1
        correctRef.current = n
        setCorrectCount(n)
        window.setTimeout(() => goNext(n), 700)
        return
      }
      soundEngine.play('answer-wrong')
      setFeedback('bad')
      window.setTimeout(() => {
        setPicked([])
        setUsedPoolIdx(new Set())
        setFeedback(null)
        setLocked(false)
      }, 900)
    },
    [goNext, question],
  )

  const onPoolTap = (poolIndex: number, token: string) => {
    if (!question || locked || usedPoolIdx.has(poolIndex)) return
    const nextUsed = new Set(usedPoolIdx)
    nextUsed.add(poolIndex)
    const nextPicked = [...picked, token]
    setUsedPoolIdx(nextUsed)
    setPicked(nextPicked)
    setFeedback(null)
    if (nextPicked.length === question.tokens.length) {
      check(nextPicked)
    }
  }

  const onPickedTap = (pickedIndex: number) => {
    if (!question || locked) return
    // Quitar desde el final hasta ese índice (simplifica tracking pool)
    const keep = picked.slice(0, pickedIndex)
    setPicked(keep)
    // Reconstruir used a partir de keep: re-mapear por aparición
    const counts = new Map<string, number>()
    for (const t of keep) counts.set(t, (counts.get(t) ?? 0) + 1)
    const nextUsed = new Set<number>()
    question.scrambled.forEach((tok, i) => {
      const n = counts.get(tok) ?? 0
      if (n > 0) {
        nextUsed.add(i)
        counts.set(tok, n - 1)
      }
    })
    setUsedPoolIdx(nextUsed)
    setFeedback(null)
  }

  if (!question) return null

  return (
    <AppShell title="MONTA LA FRASE" shortTitle="Frase" showBack backTo={WORDS_PATH}>
      <div className="monta-frase-play">
        <header className="monta-frase-head">
          <p className="monta-frase-progress">
            Frase {index + 1} / {queue.length} · {correctCount} bien
          </p>
          <h2 className="monta-frase-prompt">Monta la frase</h2>
          <p className="monta-frase-hint">{question.tip}</p>
        </header>

        <ol
          className={`monta-frase-answer${feedback === 'ok' ? ' is-ok' : ''}${feedback === 'bad' ? ' is-bad' : ''}`}
          aria-label="Tu frase"
        >
          {picked.length === 0 ? (
            <li className="monta-frase-answer__empty">Toca las palabras…</li>
          ) : (
            picked.map((tok, i) => (
              <li key={`p-${i}-${tok}`}>
                <button
                  type="button"
                  className="monta-frase-chip monta-frase-chip--picked"
                  onClick={() => onPickedTap(i)}
                  disabled={locked}
                >
                  {tok}
                </button>
              </li>
            ))
          )}
        </ol>

        {feedback === 'bad' ? (
          <p className="monta-frase-reveal" role="status">
            Era: {question.sentence}
          </p>
        ) : null}

        <ul className="monta-frase-pool" aria-label="Palabras">
          {question.scrambled.map((tok, i) => {
            if (usedPoolIdx.has(i)) return null
            return (
              <li key={`pool-${i}-${tok}`}>
                <button
                  type="button"
                  className="monta-frase-chip"
                  disabled={locked}
                  onClick={() => onPoolTap(i, tok)}
                >
                  {tok}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </AppShell>
  )
}
