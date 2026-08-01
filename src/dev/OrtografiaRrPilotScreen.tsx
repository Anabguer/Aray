import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import rrPackJson from '@feinetas/ortografia/rr.json'
import {
  assertValidOrtographyLemmaPack,
  type OrtographyLemmaPack,
} from '@/feinetas/ortographyLemmaPack'
import { buildOrtographyPackRound, type OrtographyMcqQuestion } from '@/feinetas/ortographyMcq'
import { soundEngine } from '@/sound/soundEngine'
import './ortografiaRrPilot.css'

assertValidOrtographyLemmaPack(rrPackJson)
const RR_PACK = rrPackJson as OrtographyLemmaPack

/**
 * Pantalla DEV temporal: valida el pack piloto RR en MCQ.
 * No usa spelling legacy ni progreso.
 * Ruta: /dev/ortografia-rr
 */
export function OrtografiaRrPilotScreen() {
  const [seed, setSeed] = useState(() => Date.now())
  const questions = useMemo(() => buildOrtographyPackRound(RR_PACK, seed), [seed])

  const [index, setIndex] = useState(0)
  const [locked, setLocked] = useState(false)
  const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null)
  const [picked, setPicked] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)
  const openedRef = useRef(false)

  const current: OrtographyMcqQuestion | undefined = questions[index]
  const total = questions.length

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    soundEngine.unlock()
    soundEngine.play('activity-open')
  }, [])

  const restart = useCallback(() => {
    setSeed(Date.now())
    setIndex(0)
    setLocked(false)
    setFeedback(null)
    setPicked(null)
    setCorrectCount(0)
    setDone(false)
  }, [])

  const onPick = useCallback(
    (optionIndex: number) => {
      if (!current || locked || done) return
      setLocked(true)
      setPicked(optionIndex)
      const ok = optionIndex === current.correctIndex
      setFeedback(ok ? 'ok' : 'bad')
      if (ok) {
        setCorrectCount((n) => n + 1)
        soundEngine.play('correct')
      } else {
        soundEngine.play('wrong')
      }
    },
    [current, done, locked],
  )

  const goNext = useCallback(() => {
    if (!current) return
    const next = index + 1
    if (next >= total) {
      setDone(true)
      setFeedback(null)
      setLocked(false)
      setPicked(null)
      soundEngine.play('activity-open')
      return
    }
    setIndex(next)
    setLocked(false)
    setFeedback(null)
    setPicked(null)
  }, [current, index, total])

  return (
    <AppShell title="DEV · Ortografía RR" showBack backTo="/dev/lumo" showLobbyLink={false}>
      <div className="rr-pilot">
        <p className="rr-pilot__badge">
          Piloto temporal · pack <code>{RR_PACK.pack.id}</code> · schema v
          {RR_PACK.schemaVersion} · sin legacy
        </p>

        {done ? (
          <section className="rr-pilot__summary" aria-live="polite">
            <h2>Ronda completada</h2>
            <p>
              {correctCount} / {total} aciertos
            </p>
            <p className="rr-pilot__meta">
              JSON cargado: {RR_PACK.lemmas.length} lemas · owner{' '}
              {RR_PACK.pack.ownerBank}
            </p>
            <div className="rr-pilot__actions">
              <button type="button" className="btn-primary" onClick={restart}>
                Repetir ronda
              </button>
              <Link className="btn-ghost" to="/dev/lumo">
                Volver a /dev
              </Link>
            </div>
          </section>
        ) : current ? (
          <>
            <header className="rr-pilot__hud">
              <span>
                {index + 1} / {total}
              </span>
              <span>Aciertos: {correctCount}</span>
              <span className="rr-pilot__lemma-id">{current.lemmaId}</span>
            </header>

            <h2 className="rr-pilot__prompt">{current.prompt}</h2>
            {current.tip ? <p className="rr-pilot__tip">{current.tip}</p> : null}

            <div className="rr-pilot__options" role="group" aria-label="Opciones">
              {current.options.map((opt, i) => {
                let state = ''
                if (feedback && picked !== null) {
                  if (i === current.correctIndex) state = 'is-correct'
                  else if (i === picked) state = 'is-wrong'
                }
                return (
                  <button
                    key={`${current.id}-${opt}-${i}`}
                    type="button"
                    className={`answer-btn ${state}`}
                    disabled={locked}
                    onClick={() => onPick(i)}
                  >
                    <span className="answer-btn__value">{opt}</span>
                  </button>
                )
              })}
            </div>

            {feedback ? (
              <div className={`rr-pilot__feedback is-${feedback}`} aria-live="polite">
                <p>
                  {feedback === 'ok'
                    ? 'Correcto'
                    : `Incorrecto · forma bien: ${current.lemma}`}
                </p>
                <p className="rr-pilot__rule">{current.ruleText}</p>
                <button type="button" className="btn-primary" onClick={goNext}>
                  {index + 1 >= total ? 'Ver resumen' : 'Siguiente'}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <p>No hay preguntas en el pack.</p>
        )}
      </div>
    </AppShell>
  )
}
