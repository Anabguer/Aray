import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { buildFormarPalabrasRound, type FormarPalabrasRoundItem } from '@/feinetas'
import { soundEngine } from '@/sound/soundEngine'
import {
  boardLetterInvariant,
  initialBoard,
  keepCorrectRecycleWrong,
  type Slot,
} from '@/features/languages/formar-palabras/formarPalabrasBoard'
import './formar-palabras.css'

const ROUND_SIZE = 8
const WORDS_PATH = '/missions/languages/words'
const SUMMARY_PATH = '/missions/languages/formar-palabras/summary'

type BoardState = {
  slots: Slot[]
  pool: string[]
  lockedSlots: boolean[]
}

export function FormarPalabrasPlayScreen() {
  const navigate = useNavigate()
  const seedRef = useRef(Date.now())
  const correctRef = useRef(0)
  const openedRef = useRef(false)
  const boardRef = useRef<BoardState>({ slots: [], pool: [], lockedSlots: [] })
  const recycleTimerRef = useRef<number | null>(null)

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
  const [board, setBoard] = useState<BoardState>({ slots: [], pool: [], lockedSlots: [] })
  const [fails, setFails] = useState(0)
  const [inputLocked, setInputLocked] = useState(false)
  const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null)
  const [correctCount, setCorrectCount] = useState(0)

  const current: FormarPalabrasRoundItem | undefined = round.items[index]
  const fixedCount = board.lockedSlots.filter(Boolean).length

  const commitBoard = useCallback((next: BoardState) => {
    boardRef.current = next
    setBoard(next)
  }, [])

  const applyItem = useCallback(
    (item: FormarPalabrasRoundItem) => {
      if (recycleTimerRef.current != null) {
        window.clearTimeout(recycleTimerRef.current)
        recycleTimerRef.current = null
      }
      const init = initialBoard(item.item.palabra, item.scrambled)
      commitBoard({
        slots: init.slots,
        pool: init.pool,
        lockedSlots: init.locked,
      })
      setFails(0)
      setInputLocked(false)
      setFeedback(null)
    },
    [commitBoard],
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
      if (recycleTimerRef.current != null) window.clearTimeout(recycleTimerRef.current)
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
      if (!current) return
      setInputLocked(true)
      const ok = filled.join('') === current.item.palabra

      if (ok) {
        setFeedback('ok')
        commitBoard({
          slots: filled,
          pool: [],
          lockedSlots: filled.map(() => true),
        })
        const nextCorrect = correctRef.current + 1
        correctRef.current = nextCorrect
        setCorrectCount(nextCorrect)
        if (meta.correccion.acierto?.sonido) soundEngine.play('answer-correct')
        window.setTimeout(() => goNext(nextCorrect), 700)
        return
      }

      // Fija al instante todas las posiciones correctas; montón = solo lo que falta.
      const kept = keepCorrectRecycleWrong(filled, current.item.palabra)
      commitBoard({
        slots: kept.slots,
        pool: kept.pool,
        lockedSlots: kept.locked,
      })
      setFeedback('bad')
      soundEngine.play('answer-wrong')
      if (meta.correccion.fallo?.contar_fallo) setFails((f) => f + 1)

      if (recycleTimerRef.current != null) window.clearTimeout(recycleTimerRef.current)
      recycleTimerRef.current = window.setTimeout(() => {
        recycleTimerRef.current = null
        setFeedback(null)
        setInputLocked(false)
      }, 650)
    },
    [commitBoard, current, goNext, meta],
  )

  const onPickFromPool = (poolIndex: number) => {
    if (!current || inputLocked) return
    const { slots, pool, lockedSlots } = boardRef.current
    const letter = pool[poolIndex]
    if (!letter) return
    const emptyAt = slots.findIndex((s) => s == null)
    if (emptyAt < 0) return

    const nextSlots = [...slots]
    nextSlots[emptyAt] = letter
    const nextPool = pool.filter((_, i) => i !== poolIndex)
    commitBoard({ slots: nextSlots, pool: nextPool, lockedSlots })
    setFeedback(null)

    if (nextSlots.every((s) => s != null)) {
      checkAnswer(nextSlots as string[])
    }
  }

  const onClearSlot = (slotIndex: number) => {
    if (!current || inputLocked) return
    const { slots, pool, lockedSlots } = boardRef.current
    const letter = slots[slotIndex]
    if (!letter || lockedSlots[slotIndex]) return

    const nextSlots = [...slots]
    nextSlots[slotIndex] = null
    const nextPool = [...pool, letter]
    if (!boardLetterInvariant(nextSlots, nextPool, current.item.palabra)) return
    commitBoard({ slots: nextSlots, pool: nextPool, lockedSlots })
  }

  if (!current) {
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
          {board.pool.map((ch, i) => (
            <li key={`pool-${i}-${ch}-${board.pool.length}`}>
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
