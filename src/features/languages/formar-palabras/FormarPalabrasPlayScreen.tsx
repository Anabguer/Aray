import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { buildFormarPalabrasRound, type FormarPalabrasRoundItem } from '@/feinetas'
import { soundEngine } from '@/sound/soundEngine'
import {
  initialBoard,
  keepCorrectRecycleWrong,
  type Slot,
} from '@/features/languages/formar-palabras/formarPalabrasBoard'
import './formar-palabras.css'

const ROUND_SIZE = 8
const WORDS_PATH = '/missions/languages/words'
const SUMMARY_PATH = '/missions/languages/formar-palabras/summary'

export function FormarPalabrasPlayScreen() {
  const navigate = useNavigate()
  const seedRef = useRef(Date.now())
  const correctRef = useRef(0)
  const openedRef = useRef(false)

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
  const [slots, setSlots] = useState<Slot[]>([])
  const [pool, setPool] = useState<Array<string | null>>([])
  const [lockedSlots, setLockedSlots] = useState<boolean[]>([])
  const [fails, setFails] = useState(0)
  const [locked, setLocked] = useState(false)
  const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [fixedCount, setFixedCount] = useState(1)

  const current: FormarPalabrasRoundItem | undefined = round.items[index]

  const applyItem = useCallback((item: FormarPalabrasRoundItem) => {
    // Siempre ≥1 letra de ayuda (primera).
    const board = initialBoard(item.item.palabra, item.scrambled)
    setSlots(board.slots)
    setPool(board.pool)
    setLockedSlots(board.locked)
    setFails(0)
    setLocked(false)
    setFeedback(null)
    setFixedCount(board.locked.filter(Boolean).length)
  }, [])

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
      setLocked(true)
      const ok = filled.join('') === current.item.palabra

      if (ok) {
        setFeedback('ok')
        setLockedSlots(filled.map(() => true))
        setFixedCount(filled.length)
        const nextCorrect = correctRef.current + 1
        correctRef.current = nextCorrect
        setCorrectCount(nextCorrect)
        if (meta.correccion.acierto?.sonido) soundEngine.play('answer-correct')
        window.setTimeout(() => goNext(nextCorrect), 700)
        return
      }

      setFeedback('bad')
      soundEngine.play('answer-wrong')
      if (meta.correccion.fallo?.contar_fallo) setFails((f) => f + 1)

      const kept = keepCorrectRecycleWrong(filled, pool, current.item.palabra, lockedSlots)
      // Marca en verde al instante las que van bien; luego quita las malas.
      setLockedSlots(kept.locked)
      setFixedCount(kept.locked.filter(Boolean).length)

      window.setTimeout(() => {
        setSlots(kept.slots)
        setPool(kept.pool)
        setFeedback(null)
        setLocked(false)
      }, 650)
    },
    [current, goNext, lockedSlots, meta, pool],
  )

  const onPickFromPool = (poolIndex: number) => {
    if (!current || locked) return
    const letter = pool[poolIndex]
    if (!letter) return
    const emptyAt = slots.findIndex((s) => s == null)
    if (emptyAt < 0) return

    const nextSlots = [...slots]
    nextSlots[emptyAt] = letter
    const nextPool = [...pool]
    nextPool[poolIndex] = null
    setSlots(nextSlots)
    setPool(nextPool)
    setFeedback(null)

    if (nextSlots.every((s) => s != null)) {
      checkAnswer(nextSlots as string[])
    }
  }

  const onClearSlot = (slotIndex: number) => {
    if (!current || locked) return
    const letter = slots[slotIndex]
    if (!letter) return
    if (lockedSlots[slotIndex]) return

    const nextSlots = [...slots]
    nextSlots[slotIndex] = null
    const nextPool = [...pool]
    const emptyPool = nextPool.findIndex((p) => p == null)
    if (emptyPool >= 0) nextPool[emptyPool] = letter
    else nextPool.push(letter)
    setSlots(nextSlots)
    setPool(nextPool)
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
          {slots.map((ch, i) => {
            const isFixed = Boolean(lockedSlots[i])
            const flashWrong = feedback === 'bad' && ch != null && !isFixed
            return (
              <button
                key={`slot-${i}`}
                type="button"
                className={[
                  'formar-play__slot',
                  ch ? 'has-letter' : '',
                  isFixed ? 'is-correct' : '',
                  flashWrong ? 'is-wrong' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onClearSlot(i)}
                disabled={locked || !ch || isFixed}
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
            <li key={`pool-${i}`}>
              <button
                type="button"
                className={`formar-play__tile${ch == null ? ' is-used' : ''}`}
                disabled={locked || ch == null}
                onClick={() => onPickFromPool(i)}
              >
                {ch ?? ''}
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
