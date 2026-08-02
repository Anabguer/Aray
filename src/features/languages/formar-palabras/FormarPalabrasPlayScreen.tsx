import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { buildFormarPalabrasRound, type FormarPalabrasRoundItem } from '@/feinetas'
import { soundEngine } from '@/sound/soundEngine'
import {
  derivedPool,
  initialBoard,
  lockCorrectClearWrong,
  type Slot,
} from '@/features/languages/formar-palabras/formarPalabrasBoard'
import './formar-palabras.css'

const ROUND_SIZE = 8
const WORDS_PATH = '/missions/languages/words'
const SUMMARY_PATH = '/missions/languages/formar-palabras/summary'

type BoardState = {
  slots: Slot[]
  lockedSlots: boolean[]
  scrambleOrder: string[]
  palabra: string
}

export function FormarPalabrasPlayScreen() {
  const navigate = useNavigate()
  const seedRef = useRef(Date.now())
  const correctRef = useRef(0)
  const openedRef = useRef(false)
  const boardRef = useRef<BoardState | null>(null)
  const inputLockedRef = useRef(false)
  const feedbackTimerRef = useRef<number | null>(null)

  const round = useMemo(
    () =>
      buildFormarPalabrasRound(ROUND_SIZE, () => {
        seedRef.current = (seedRef.current * 16807) % 2147483647
        return (seedRef.current % 1000) / 1000
      }),
    [],
  )

  const meta = round.meta
  const [index, setIndex] = useState(0)
  const [board, setBoard] = useState<BoardState | null>(null)
  const [fails, setFails] = useState(0)
  const [inputLocked, setInputLocked] = useState(false)
  const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null)
  const [correctCount, setCorrectCount] = useState(0)

  const current: FormarPalabrasRoundItem | undefined = round.items[index]

  const pool = useMemo(() => {
    if (!board) return []
    return derivedPool(board.palabra, board.slots, board.scrambleOrder)
  }, [board])

  const fixedCount = board?.lockedSlots.filter(Boolean).length ?? 0

  const commitBoard = useCallback((next: BoardState) => {
    boardRef.current = next
    setBoard(next)
  }, [])

  const setInputLock = useCallback((value: boolean) => {
    inputLockedRef.current = value
    setInputLocked(value)
  }, [])

  const applyItem = useCallback(
    (item: FormarPalabrasRoundItem) => {
      if (feedbackTimerRef.current != null) {
        window.clearTimeout(feedbackTimerRef.current)
        feedbackTimerRef.current = null
      }
      const init = initialBoard(item.item.palabra, item.scrambled)
      commitBoard({
        slots: init.slots,
        lockedSlots: init.locked,
        scrambleOrder: init.scrambleOrder,
        palabra: item.item.palabra,
      })
      setFails(0)
      setInputLock(false)
      setFeedback(null)
    },
    [commitBoard, setInputLock],
  )

  useEffect(() => {
    if (!round.items[0]) return
    applyItem(round.items[0])
  }, [applyItem, round.items])

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    soundEngine.unlock()
    soundEngine.play('activity-open')
  }, [])

  useEffect(
    () => () => {
      if (feedbackTimerRef.current != null) window.clearTimeout(feedbackTimerRef.current)
    },
    [],
  )

  const finishRound = useCallback(
    (finalCorrect: number) => {
      navigate(SUMMARY_PATH, {
        replace: true,
        state: {
          correct: finalCorrect,
          total: round.items.length,
          title: meta.nombre,
        },
      })
    },
    [meta.nombre, navigate, round.items.length],
  )

  const goNext = useCallback(
    (finalCorrect: number) => {
      const next = index + 1
      if (next >= round.items.length) {
        finishRound(finalCorrect)
        return
      }
      setIndex(next)
      applyItem(round.items[next]!)
    },
    [applyItem, finishRound, index, round.items],
  )

  const checkAnswer = useCallback(
    (filled: string[]) => {
      const b = boardRef.current
      if (!b || !current) return
      setInputLock(true)

      if (filled.join('') === b.palabra) {
        setFeedback('ok')
        commitBoard({
          ...b,
          slots: filled,
          lockedSlots: filled.map(() => true),
        })
        const nextCorrect = correctRef.current + 1
        correctRef.current = nextCorrect
        setCorrectCount(nextCorrect)
        if (meta.correccion.acierto?.sonido) soundEngine.play('answer-correct')
        window.setTimeout(() => goNext(nextCorrect), 700)
        return
      }

      const kept = lockCorrectClearWrong(filled, b.palabra)
      commitBoard({
        ...b,
        slots: kept.slots,
        lockedSlots: kept.locked,
      })
      setFeedback('bad')
      soundEngine.play('answer-wrong')
      if (meta.correccion.fallo?.contar_fallo) setFails((f) => f + 1)

      if (feedbackTimerRef.current != null) window.clearTimeout(feedbackTimerRef.current)
      feedbackTimerRef.current = window.setTimeout(() => {
        feedbackTimerRef.current = null
        setFeedback(null)
        setInputLock(false)
      }, 650)
    },
    [commitBoard, current, goNext, meta, setInputLock],
  )

  const onPickFromPool = (poolIndex: number) => {
    if (!current || inputLockedRef.current) return
    const b = boardRef.current
    if (!b) return

    // Pool siempre derivado del tablero actual (fuente de verdad).
    const currentPool = derivedPool(b.palabra, b.slots, b.scrambleOrder)
    const letter = currentPool[poolIndex]
    if (!letter) return
    const emptyAt = b.slots.findIndex((s) => s == null)
    if (emptyAt < 0) return

    const nextSlots = [...b.slots]
    nextSlots[emptyAt] = letter
    commitBoard({ ...b, slots: nextSlots })
    setFeedback(null)

    if (nextSlots.every((s) => s != null)) {
      checkAnswer(nextSlots as string[])
    }
  }

  const onClearSlot = (slotIndex: number) => {
    if (!current || inputLockedRef.current) return
    const b = boardRef.current
    if (!b) return
    if (!b.slots[slotIndex] || b.lockedSlots[slotIndex]) return

    const nextSlots = [...b.slots]
    nextSlots[slotIndex] = null
    commitBoard({ ...b, slots: nextSlots })
  }

  if (!current || !board) {
    return (
      <AppShell title="FORMAR PALABRAS" shortTitle="Formar" showBack backTo={WORDS_PATH}>
        <p>No hay palabras en el banco.</p>
      </AppShell>
    )
  }

  return (
    <AppShell title="FORMAR PALABRAS" shortTitle="Formar" showBack backTo={WORDS_PATH}>
      <section className="formar-play" aria-labelledby="formar-prompt">
        <div className="formar-play__hud">
          <span>
            {index + 1} / {round.items.length}
          </span>
          <span>{correctCount} aciertos</span>
        </div>

        <h2 id="formar-prompt" className="formar-play__prompt">
          Ordena las letras
        </h2>
        <p className="formar-play__grupo">{current.item.grupo.replace(/-/g, ' · ')}</p>

        <div
          className={[
            'formar-play__slots',
            feedback === 'ok' ? 'is-ok' : '',
            feedback === 'bad' ? 'is-bad' : '',
            meta.correccion.acierto?.animacion && feedback === 'ok' ? 'is-pop' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-label="Casillas de la palabra"
        >
          {board.slots.map((ch, i) => {
            const isFixed = Boolean(board.lockedSlots[i])
            return (
              <button
                key={`slot-${i}`}
                type="button"
                className={[
                  'formar-play__slot',
                  ch ? 'has-letter' : '',
                  isFixed ? 'is-correct' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onClearSlot(i)}
                disabled={inputLocked || !ch || isFixed}
                aria-label={
                  isFixed
                    ? `${ch}, bien colocada`
                    : ch
                      ? `Quitar ${ch}`
                      : `Casilla ${i + 1} vacía`
                }
              >
                {ch ?? ''}
              </button>
            )
          })}
        </div>

        <ul className="formar-play__pool" aria-label="Letras desordenadas">
          {pool.map((ch, i) => (
            <li key={`pool-${board.palabra}-${i}-${ch}`}>
              <button
                type="button"
                className="formar-play__tile"
                disabled={inputLocked}
                onClick={() => onPickFromPool(i)}
              >
                {ch}
              </button>
            </li>
          ))}
        </ul>

        <p className="formar-play__hint" role="status">
          {fixedCount > 1
            ? `¡${fixedCount} letras en verde van ahí!`
            : 'La letra verde ya está bien colocada'}
          {fails > 0 ? ` · Fallos: ${fails}` : ''}
        </p>

        <Link to={WORDS_PATH} className="btn btn-ghost btn-block">
          Salir
        </Link>
      </section>
    </AppShell>
  )
}
