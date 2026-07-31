import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ALPHABET_ROUND_SIZE,
  buildAlphabetRound,
  isOrderComplete,
  useAlphabetSession,
  type AlphabetPlayMode,
  type AlphabetQuestion,
} from '@/alphabet'
import { AppShell } from '@/components/AppShell'
import { Lumo } from '@/lumo/Lumo'
import { useLumoController } from '@/lumo/useLumoController'
import { soundEngine } from '@/sound/soundEngine'

const MODE_TITLES: Record<AlphabetPlayMode, string> = {
  missing: 'LETRA QUE FALTA',
  neighbor: 'SIGUIENTE',
  'order-letters': 'ORDENA LETRAS',
  'order-words': 'ORDENA PALABRAS',
  random: 'RANDOM',
}

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

export function AlphabetPlayScreen() {
  const { mode: modeParam } = useParams<{ mode: string }>()
  const navigate = useNavigate()
  const { setLastSummary, setLastMode } = useAlphabetSession()
  const lumo = useLumoController('thinking')
  const seedRef = useRef(Date.now())
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
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [shakeId, setShakeId] = useState<string | null>(null)
  const openedRef = useRef(false)
  const finishedRef = useRef(false)

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
    lumo.setThinking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  useEffect(() => {
    if (!isPlayMode(modeParam)) {
      navigate('/missions/languages/alphabet', { replace: true })
    }
  }, [modeParam, navigate])

  useEffect(() => {
    if (question || finishedRef.current) return
    finishedRef.current = true
    setLastSummary({
      mode,
      total: ALPHABET_ROUND_SIZE,
      correct: correctCount,
      bestStreak,
    })
    navigate('/missions/languages/alphabet/summary', { replace: true })
  }, [question, correctCount, bestStreak, mode, navigate, setLastSummary])

  if (!isPlayMode(modeParam)) return null
  if (!question) return null

  function registerCorrect() {
    soundEngine.play('correct')
    lumo.reactToAnswer({ correct: true, streak: streak + 1 })
    setCorrectCount((c) => c + 1)
    setStreak((s) => {
      const next = s + 1
      setBestStreak((b) => Math.max(b, next))
      return next
    })
    setFeedback('¡Bien!')
  }

  function registerWrong(hint: string) {
    soundEngine.play('wrong')
    lumo.reactToAnswer({ correct: false, streak: 0 })
    setStreak(0)
    setFeedback(hint)
  }

  function advance(delay: number) {
    window.setTimeout(() => {
      setSelected(null)
      setFeedback(null)
      setLocked(false)
      setPicked([])
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
      registerCorrect()
      advance(700)
    } else {
      registerWrong(`Era: ${question.answer}`)
      advance(1400)
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
      registerWrong(
        question.kind === 'order-letters'
          ? `Siguiente: ${question.answer[picked.length]}`
          : `Siguiente: ${question.answer[picked.length]}`,
      )
      setLocked(true)
      window.setTimeout(() => {
        setShakeId(null)
        setFeedback(null)
        setLocked(false)
        setPicked([])
        lumo.setThinking()
      }, 1100)
      return
    }

    setPicked(next)
    if (status === 'correct') {
      setLocked(true)
      registerCorrect()
      advance(800)
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

  return (
    <AppShell
      title={title}
      shortTitle="Abc"
      showBack
      backTo="/missions/languages/alphabet"
    >
      <section className="alphabet-play" aria-label={title}>
        <header className="alphabet-play__hud">
          <p className="alphabet-play__count">
            {index + 1} / {ALPHABET_ROUND_SIZE}
          </p>
          <p className="alphabet-play__streak" aria-live="polite">
            Racha {streak}
          </p>
        </header>

        <div className="alphabet-play__stage">
          <div className="alphabet-play__lumo">
            <Lumo state={lumo.state} intensity={lumo.intensity} size="sm" />
          </div>
          <p className="alphabet-play__prompt">{promptFor(question)}</p>

          {question.kind === 'missing' ? (
            <div className="alphabet-chain" aria-label="Cadena de letras">
              {question.sequence.map((letter, i) => (
                <span
                  key={`${question.id}-seq-${i}`}
                  className={
                    letter == null
                      ? 'alphabet-chain__slot is-blank'
                      : 'alphabet-chain__slot'
                  }
                >
                  {letter ?? '?'}
                </span>
              ))}
            </div>
          ) : null}

          {question.kind === 'neighbor' ? (
            <div className="alphabet-neighbor" aria-label="Letra de Lumo">
              <span className="alphabet-neighbor__letter">{question.letter}</span>
              <span className="alphabet-neighbor__gap" aria-hidden="true">
                {question.direction === 'next' ? '→' : '←'}
              </span>
              <span className="alphabet-neighbor__slot">?</span>
            </div>
          ) : null}

          {(question.kind === 'order-letters' || question.kind === 'order-words') &&
          picked.length > 0 ? (
            <ol className="alphabet-picked" aria-label="Tu orden">
              {picked.map((item) => (
                <li key={`picked-${item}`} className="alphabet-picked__item">
                  {item}
                </li>
              ))}
            </ol>
          ) : null}
        </div>

        {question.kind === 'missing' || question.kind === 'neighbor' ? (
          <div
            className={`alphabet-options alphabet-options--scatter alphabet-options--d${question.difficulty}`}
            role="group"
            aria-label="Letras"
          >
            {question.options.map((opt, i) => {
              const isSel = selected === opt
              const isCorrect = opt === question.answer
              let cls = 'alphabet-chip'
              if (selected != null && isSel && isCorrect) cls += ' is-ok'
              if (selected != null && isSel && !isCorrect) cls += ' is-bad'
              if (selected != null && !isSel && isCorrect && locked) cls += ' is-reveal'
              return (
                <button
                  key={`${question.id}-opt-${opt}`}
                  type="button"
                  className={`${cls} alphabet-chip--pos-${i % 6}`}
                  disabled={locked}
                  onClick={() => onPickOption(opt)}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        ) : null}

        {question.kind === 'order-letters' ? (
          <div className="alphabet-options alphabet-options--grid" role="group" aria-label="Letras">
            {remainingPool.map((opt) => (
              <button
                key={`${question.id}-L-${opt}`}
                type="button"
                className={`alphabet-chip${shakeId === opt ? ' is-shake' : ''}`}
                disabled={locked}
                onClick={() => onPickOrderItem(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : null}

        {question.kind === 'order-words' ? (
          <div className="alphabet-scatter" role="group" aria-label="Palabras">
            {question.words.map((word, i) => {
              if (picked.includes(word)) return null
              const pos = question.positions[i]!
              return (
                <button
                  key={`${question.id}-W-${word}`}
                  type="button"
                  className={`alphabet-word${shakeId === word ? ' is-shake' : ''}`}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: `rotate(${pos.rotate}deg)`,
                  }}
                  disabled={locked}
                  onClick={() => onPickOrderItem(word)}
                >
                  {word}
                </button>
              )
            })}
          </div>
        ) : null}

        {feedback ? (
          <p className="alphabet-play__feedback" role="status">
            {feedback}
          </p>
        ) : null}
      </section>
    </AppShell>
  )
}
