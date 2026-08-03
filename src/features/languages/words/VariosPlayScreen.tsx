import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import {
  buildVariosSession,
  isVariosProductId,
  VARIOS_LABELS,
  VARIOS_ROUNDS,
  type VariosProductId,
} from '@/minigames/adapters/palabrasVarios'
import { soundEngine } from '@/sound/soundEngine'
import './varios.css'

const WORDS_PATH = '/missions/languages/words'

/** Rutas fijas (/words/quien-hace-que) no exponen :productId; lo leemos del path. */
function resolveVariosProductId(
  paramId: string | undefined,
  pathname: string,
): VariosProductId | null {
  const fromParam = paramId && isVariosProductId(paramId) ? paramId : null
  if (fromParam) return fromParam
  const m = pathname.match(/\/words\/([^/]+)/)
  const fromPath = m?.[1]
  return fromPath && isVariosProductId(fromPath) ? fromPath : null
}

export function VariosPlayScreen() {
  const { productId: rawParam } = useParams<{ productId?: string }>()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const productId = resolveVariosProductId(rawParam, pathname)

  const seedRef = useRef(Date.now())
  const openedRef = useRef(false)
  const correctRef = useRef(0)

  const session = useMemo(() => {
    if (!productId) return []
    return buildVariosSession(productId, VARIOS_ROUNDS, seedRef.current)
  }, [productId])

  const [roundIndex, setRoundIndex] = useState(0)
  const [selLeft, setSelLeft] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrongRight, setWrongRight] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  const board = session[roundIndex]
  const label = productId ? VARIOS_LABELS[productId] : 'Varios'

  useEffect(() => {
    if (!productId) navigate(WORDS_PATH, { replace: true })
  }, [productId, navigate])

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    soundEngine.unlock()
    soundEngine.play('activity-open')
  }, [])

  useEffect(() => {
    setSelLeft(null)
    setMatched(new Set())
    setWrongRight(null)
    setLocked(false)
  }, [roundIndex])

  const finish = useCallback(() => {
    if (!productId) return
    navigate(`/missions/languages/words/${productId}/summary`, {
      replace: true,
      state: {
        correct: correctRef.current,
        total: session.length,
        title: label,
        productId,
      },
    })
  }, [label, navigate, productId, session.length])

  const goNext = useCallback(() => {
    const next = roundIndex + 1
    if (next >= session.length) {
      finish()
      return
    }
    setRoundIndex(next)
  }, [finish, roundIndex, session.length])

  if (!productId || !board) return null

  const rightLabel = (id: string) =>
    board.pairs.find((p) => p.id === id)?.right ?? ''

  function onLeft(id: string) {
    if (locked || matched.has(id)) return
    setSelLeft((prev) => (prev === id ? null : id))
    setWrongRight(null)
  }

  function onRight(id: string) {
    if (locked || !selLeft || matched.has(id)) return
    if (selLeft === id) {
      soundEngine.play('answer-correct')
      const next = new Set(matched)
      next.add(id)
      setMatched(next)
      setSelLeft(null)
      if (next.size >= board.pairs.length) {
        correctRef.current += 1
        setCorrectCount(correctRef.current)
        setLocked(true)
        window.setTimeout(() => goNext(), 650)
      }
      return
    }
    soundEngine.play('answer-wrong')
    setWrongRight(id)
    setLocked(true)
    window.setTimeout(() => {
      setWrongRight(null)
      setSelLeft(null)
      setLocked(false)
    }, 480)
  }

  if (!productId || !board) return null

  return (
    <AppShell title={label.toUpperCase()} shortTitle="Varios" showBack backTo={WORDS_PATH}>
      <div className="varios-play">
        <header className="varios-head">
          <p className="varios-progress">
            Tablero {roundIndex + 1} / {session.length} · {correctCount} bien
          </p>
          <h2 className="varios-prompt">{board.prompt}</h2>
          <p className="varios-hint">{board.help}</p>
        </header>

        <div className="varios-match" role="group" aria-label="Empareja">
          <ul className="varios-col" aria-label="Izquierda">
            {board.pairs.map((p) => (
              <li key={`L-${p.id}`}>
                <button
                  type="button"
                  className={`varios-chip${selLeft === p.id ? ' is-selected' : ''}${matched.has(p.id) ? ' is-done' : ''}`}
                  disabled={locked || matched.has(p.id)}
                  onClick={() => onLeft(p.id)}
                >
                  {p.left}
                </button>
              </li>
            ))}
          </ul>
          <ul className="varios-col" aria-label="Derecha">
            {board.rightOrder.map((id) => (
              <li key={`R-${id}`}>
                <button
                  type="button"
                  className={`varios-chip varios-chip--right${wrongRight === id ? ' is-wrong' : ''}${matched.has(id) ? ' is-done' : ''}${selLeft ? ' is-target' : ''}`}
                  disabled={locked || matched.has(id) || !selLeft}
                  onClick={() => onRight(id)}
                >
                  {rightLabel(id)}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <p className="varios-hint varios-hint--action">
          {selLeft ? 'Ahora toca la pareja' : 'Toca una ficha de la izquierda'}
        </p>
      </div>
    </AppShell>
  )
}
