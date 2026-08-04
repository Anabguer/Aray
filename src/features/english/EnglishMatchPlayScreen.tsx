import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import {
  ENGLISH_PACK_LABELS,
  englishPackSupportsSceneMatch,
  isEnglishHubPackId,
  stationForEnglishPack,
} from '@/feinetas/englishRegistry'
import {
  buildEnglishMatchSession,
  ENGLISH_MATCH_ROUNDS,
} from '@/minigames/adapters/englishSceneMatch'
import { useEnglishSession } from '@/english'
import { soundEngine } from '@/sound/soundEngine'
import './english-match.css'

export function EnglishMatchPlayScreen() {
  const { packId } = useParams<{ packId: string }>()
  const navigate = useNavigate()
  const { setLastSummary, setLastMode, setLastPackId } = useEnglishSession()
  const valid =
    packId != null &&
    isEnglishHubPackId(packId) &&
    englishPackSupportsSceneMatch(packId)

  const seedRef = useRef(Date.now())
  const correctRef = useRef(0)
  const openedRef = useRef(false)

  const session = useMemo(() => {
    if (!valid || !packId) return []
    return buildEnglishMatchSession(packId, ENGLISH_MATCH_ROUNDS, seedRef.current)
  }, [packId, valid])

  const [roundIndex, setRoundIndex] = useState(0)
  const [selLeft, setSelLeft] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrongRight, setWrongRight] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  const board = session[roundIndex]
  const modesPath = valid ? `/missions/english/pack/${packId}` : '/missions/english'
  const title = packId ? ENGLISH_PACK_LABELS[packId] ?? 'Empareja' : 'Empareja'

  useEffect(() => {
    if (!valid) navigate('/missions/english', { replace: true })
  }, [valid, navigate])

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
    if (!packId) return
    setLastMode('match')
    setLastPackId(packId)
    setLastSummary({
      packId,
      mode: 'match',
      total: session.length,
      correct: correctRef.current,
      bestStreak: correctRef.current,
    })
    navigate(`${modesPath}/summary`, { replace: true })
  }, [
    modesPath,
    navigate,
    packId,
    session.length,
    setLastMode,
    setLastPackId,
    setLastSummary,
  ])

  const goNext = useCallback(() => {
    const next = roundIndex + 1
    if (next >= session.length) {
      finish()
      return
    }
    setRoundIndex(next)
  }, [finish, roundIndex, session.length])

  if (!valid || !packId || !board) return null

  const pairById = (id: string) => board.pairs.find((p) => p.id === id)

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

  const station = stationForEnglishPack(packId)

  return (
    <AppShell
      title="EMPAREJA"
      shortTitle={title}
      showBack
      backTo={modesPath}
    >
      <div className="en-match-play">
        <header className="en-match-head">
          <p className="en-match-progress">
            Tablero {roundIndex + 1} / {session.length} · {correctCount} bien
            {station ? ` · ${title}` : ''}
          </p>
          <h2 className="en-match-prompt">Une la frase con la escena</h2>
          <p className="en-match-tip">
            Toca una frase y luego la tarjeta de la derecha
          </p>
        </header>

        <div className="en-match-board" role="group" aria-label="Empareja">
          <ul className="en-match-col" aria-label="Frases">
            {board.leftOrder.map((id) => {
              const p = pairById(id)
              if (!p) return null
              return (
                <li key={`L-${id}`}>
                  <button
                    type="button"
                    className={`en-match-chip${selLeft === id ? ' is-selected' : ''}${matched.has(id) ? ' is-done' : ''}`}
                    disabled={locked || matched.has(id)}
                    onClick={() => onLeft(id)}
                  >
                    {p.left}
                  </button>
                </li>
              )
            })}
          </ul>
          <ul className="en-match-col" aria-label="Escenas">
            {board.rightOrder.map((id) => {
              const p = pairById(id)
              if (!p) return null
              return (
                <li key={`R-${id}`}>
                  <button
                    type="button"
                    className={`en-match-scene tone-${p.tone}${wrongRight === id ? ' is-wrong' : ''}${matched.has(id) ? ' is-done' : ''}${selLeft ? ' is-target' : ''}`}
                    disabled={locked || matched.has(id) || !selLeft}
                    onClick={() => onRight(id)}
                    aria-label={p.rightLabel}
                  >
                    <span className="en-match-scene__icon" aria-hidden>
                      {p.icon}
                    </span>
                    <span className="en-match-scene__label">{p.rightLabel}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </AppShell>
  )
}
