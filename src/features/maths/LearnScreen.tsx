import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { AnswerGrid, FeedbackBanner, MuteToggle } from '@/components/quiz/QuizWidgets'
import { learnUnitSizePx, MAX_MULTIPLIER, MIX_TABLES } from '@/config/playConfig'
import { lumoMessages } from '@/config/lumoMessages'
import { Lumo } from '@/lumo/Lumo'
import { useLumoController } from '@/lumo/useLumoController'
import { buildAnswerOptions } from '@/math/options'
import { makeFact } from '@/math/tables'
import { usePlaySession } from '@/progress/PlayContext'
import { useProgress } from '@/progress/ProgressContext'
import { soundEngine } from '@/sound/soundEngine'

type LearnPhase = 'ask' | 'hint' | 'reveal'

export function LearnScreen() {
  const { progress, setSoundMuted } = useProgress()
  const { selection } = usePlaySession()
  const tables = selection.mix ? [...MIX_TABLES] : selection.tables.length ? selection.tables : [7]
  const lumo = useLumoController('thinking')

  const [tableIndex, setTableIndex] = useState(0)
  const [row, setRow] = useState(1)
  const [phase, setPhase] = useState<LearnPhase>('ask')
  const [locked, setLocked] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [fails, setFails] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [transition, setTransition] = useState<string | null>(null)

  const table = tables[Math.min(tableIndex, tables.length - 1)] ?? 2
  const product = table * row
  const columns = Math.min(table, 10)
  const size = learnUnitSizePx(product, columns)
  const dots = useMemo(() => Array.from({ length: product }, (_, i) => i), [product])
  const options = useMemo(
    () => buildAnswerOptions(makeFact(table, row)),
    [table, row],
  )

  const opLabel = `Tabla ${tableIndex + 1} de ${tables.length} · Operación ${row} de ${MAX_MULTIPLIER}`

  function resetAsk() {
    setPhase('ask')
    setLocked(false)
    setSelected(null)
    setFails(0)
    setFeedback(null)
    lumo.setThinking()
  }

  function goNextOp() {
    if (row < MAX_MULTIPLIER) {
      setRow(row + 1)
      resetAsk()
      return
    }
    if (tableIndex < tables.length - 1) {
      setTransition(`Tabla del ${tables[tableIndex + 1]}`)
      window.setTimeout(() => {
        setTableIndex(tableIndex + 1)
        setRow(1)
        setTransition(null)
        resetAsk()
      }, 700)
      return
    }
    setFeedback('¡Recorrido completado!')
  }

  function onSelect(value: number) {
    if (phase === 'reveal' || locked) return
    setLocked(true)
    setSelected(value)
    if (value === product) {
      setPhase('reveal')
      setFeedback(`${table} × ${row} = ${product}`)
      lumo.reactToAnswer({ correct: true, streak: 2 })
      soundEngine.play('correct')
      window.setTimeout(() => goNextOp(), 900)
      return
    }
    const nextFails = fails + 1
    setFails(nextFails)
    setFeedback(
      nextFails === 1
        ? lumoMessages.tryAgain
        : nextFails === 2
          ? `Pista: son ${row} grupos de ${table}`
          : `Pista: está cerca de ${table * Math.max(1, row - 1)} y ${table * Math.min(MAX_MULTIPLIER, row + 1)}`,
    )
    lumo.reactToAnswer({ correct: false, streak: 0 })
    soundEngine.play('wrong')
    setPhase(nextFails >= 1 ? 'hint' : 'ask')
    window.setTimeout(() => {
      setLocked(false)
      setSelected(null)
    }, 450)
  }

  return (
    <AppShell
      title="Aprende"
      showBack
      backTo="/missions/mates/tables/modes"
      trailing={
        <MuteToggle muted={progress.soundMuted} onToggle={() => setSoundMuted(!progress.soundMuted)} />
      }
    >
      <section className="learn-screen learn-screen--guided">
        <p className="play-banner play-banner--info" role="status">
          Aprende no carga el drop. Acerta para avanzar.
        </p>

        <div className="learn-progress" aria-label="Progreso del recorrido">
          {tables.map((t, i) => (
            <span
              key={t}
              className={`learn-progress__dot${i < tableIndex ? ' is-done' : ''}${i === tableIndex ? ' is-on' : ''}`}
              title={`Tabla del ${t}`}
            >
              {t}
            </span>
          ))}
        </div>
        <p className="learn-progress__label">{opLabel}</p>

        {transition ? (
          <p className="learn-transition" role="status">
            Siguiente: {transition}
          </p>
        ) : null}

        <div className="play-stage learn-stage">
          <Lumo state={lumo.state} intensity={lumo.intensity} size="sm" />
          <div className="play-stage__main">
            <p className="learn-hint">
              {row} grupos de {table}
              {phase !== 'reveal' ? ' · ¿Cuántos hay?' : null}
            </p>
            {phase === 'reveal' ? (
              <div className="learn-equation" aria-live="polite">
                <span>
                  {table} × {row}
                </span>
                <span className="learn-equation__eq">=</span>
                <strong>{product}</strong>
              </div>
            ) : (
              <div className="learn-equation" aria-live="polite">
                <span>
                  {table} × {row}
                </span>
                <span className="learn-equation__eq">=</span>
                <strong>?</strong>
              </div>
            )}
            <div
              className={`learn-dots${product > 36 ? ' learn-dots--compact' : ''}`}
              style={
                {
                  gridTemplateColumns: `repeat(${columns}, ${size}px)`,
                  gap: 'var(--learn-gap)',
                  '--learn-unit': `${size}px`,
                } as CSSProperties
              }
              aria-hidden="true"
            >
              {dots.map((d) => (
                <span
                  key={d}
                  className={`learn-dot${d % table === 0 && d !== 0 ? ' learn-dot--group' : ''}`}
                  style={{ width: size, height: size }}
                />
              ))}
            </div>
          </div>
        </div>

        {phase !== 'reveal' ? (
          <AnswerGrid
            options={options}
            disabled={locked}
            correctValue={product}
            selectedValue={selected}
            reveal={locked && selected !== null && selected !== product}
            onSelect={onSelect}
          />
        ) : null}

        {feedback ? (
          <FeedbackBanner tone={phase === 'reveal' ? 'ok' : 'info'} message={feedback} />
        ) : null}

        <Link to="/missions/mates/tables/modes" className="btn btn-ghost btn-block">
          Salir
        </Link>
      </section>
    </AppShell>
  )
}
