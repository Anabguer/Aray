import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { AnswerGrid, MuteToggle } from '@/components/quiz/QuizWidgets'
import { learnUnitSizePx, MAX_MULTIPLIER, MIX_TABLES } from '@/config/playConfig'
import { lumoMessages } from '@/config/lumoMessages'
import { Lumo } from '@/lumo/Lumo'
import { useLumoController } from '@/lumo/useLumoController'
import { buildAnswerOptions } from '@/math/options'
import { makeFact } from '@/math/tables'
import { usePlaySession } from '@/progress/PlayContext'
import { useProgress } from '@/progress/ProgressContext'
import { soundEngine } from '@/sound/soundEngine'

type LearnPhase = 'ask' | 'hint' | 'reveal' | 'done'

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
  const [hint, setHint] = useState<string | null>(null)
  const [enterKey, setEnterKey] = useState(0)
  const [showLumoTip, setShowLumoTip] = useState(false)

  const table = tables[Math.min(tableIndex, tables.length - 1)] ?? 2
  const product = table * row
  const columns = Math.min(table, 10)
  const size = learnUnitSizePx(product, columns)
  const dots = useMemo(() => Array.from({ length: product }, (_, i) => i), [product])
  const options = useMemo(() => buildAnswerOptions(makeFact(table, row)), [table, row])

  const opIndex = tableIndex * MAX_MULTIPLIER + row
  const opTotal = tables.length * MAX_MULTIPLIER
  const progressPct = Math.min(100, Math.round(((opIndex - 1) / opTotal) * 100))

  useEffect(() => {
    setEnterKey((k) => k + 1)
    setShowLumoTip(false)
  }, [table, row])

  function resetAsk() {
    setPhase('ask')
    setLocked(false)
    setSelected(null)
    setFails(0)
    setHint(null)
    lumo.setThinking()
  }

  function goPrev() {
    if (locked || phase === 'reveal') return
    if (row > 1) {
      setRow(row - 1)
      resetAsk()
      return
    }
    if (tableIndex > 0) {
      setTableIndex(tableIndex - 1)
      setRow(MAX_MULTIPLIER)
      resetAsk()
    }
  }

  function goNextOp() {
    if (row < MAX_MULTIPLIER) {
      setRow(row + 1)
      resetAsk()
      return
    }
    if (tableIndex < tables.length - 1) {
      setTableIndex(tableIndex + 1)
      setRow(1)
      resetAsk()
      if ((tableIndex + 1) % 1 === 0) {
        lumo.reactToAnswer({ correct: true, streak: 3 })
        setShowLumoTip(true)
        setHint(`Tabla del ${tables[tableIndex + 1]}`)
      }
      return
    }
    setPhase('done')
    lumo.celebrate('record')
    soundEngine.play('reward')
  }

  function onSelect(value: number) {
    if (phase === 'reveal' || phase === 'done' || locked) return
    setLocked(true)
    setSelected(value)
    if (value === product) {
      setPhase('reveal')
      setHint(null)
      lumo.reactToAnswer({ correct: true, streak: 2 })
      soundEngine.play('correct')
      window.setTimeout(() => goNextOp(), 950)
      return
    }
    const nextFails = fails + 1
    setFails(nextFails)
    setHint(
      nextFails === 1
        ? lumoMessages.tryAgain
        : nextFails === 2
          ? `${row} grupos de ${table}`
          : `Cerca de ${table * Math.max(1, row - 1)} y ${table * Math.min(MAX_MULTIPLIER, row + 1)}`,
    )
    if (nextFails >= 2) setShowLumoTip(true)
    lumo.reactToAnswer({ correct: false, streak: 0 })
    soundEngine.play('wrong')
    setPhase('hint')
    window.setTimeout(() => {
      setLocked(false)
      setSelected(null)
    }, 450)
  }

  const canPrev = !(tableIndex === 0 && row === 1) && phase !== 'reveal' && phase !== 'done'

  return (
    <AppShell
      title="APRENDE"
      showBack
      backTo="/missions/mates/tables/modes"
      trailing={
        <MuteToggle muted={progress.soundMuted} onToggle={() => setSoundMuted(!progress.soundMuted)} />
      }
    >
      <section className="learn-lab" aria-label="Laboratorio Aprende">
        {phase === 'done' ? (
          <div className="learn-lab__done" role="status">
            <Lumo state="celebration" intensity={4} size="md" />
            <h2 className="learn-lab__done-title">Tabla descubierta</h2>
            <p className="learn-lab__done-text">Has visto todas las operaciones.</p>
            <div className="learn-lab__done-actions">
              <Link to="/missions/mates/tables/modes" className="btn btn-primary btn-block">
                ELEGIR OTRO MODO
              </Link>
              <Link to="/" className="btn btn-ghost btn-block">
                LOBBY
              </Link>
            </div>
          </div>
        ) : (
          <>
            <header className="learn-lab__hud">
              <div className="learn-lab__hud-top">
                <p className="learn-lab__table">Tabla del {table}</p>
                <p className="learn-lab__count" aria-live="polite">
                  {row} de {MAX_MULTIPLIER}
                </p>
              </div>
              <div
                className="learn-lab__bar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={opTotal}
                aria-valuenow={opIndex - 1}
                aria-label={`Progreso: ${row} de ${MAX_MULTIPLIER}`}
              >
                <span style={{ width: `${Math.max(6, (row / MAX_MULTIPLIER) * 100)}%` }} />
              </div>
              <p className="learn-lab__bar-note">
                Recorrido {Math.max(0, opIndex - 1)} / {opTotal}
                {progressPct > 0 ? ` · ${progressPct}%` : ''}
              </p>
            </header>

            <div className="learn-lab__stage" key={enterKey}>
              <div className="learn-lab__console" aria-live="polite">
                <p className="learn-lab__eyebrow">{row} grupos de {table}</p>
                <div className={`learn-lab__equation${phase === 'reveal' ? ' is-reveal' : ''}`}>
                  <span className="learn-lab__fact">
                    {table} × {row}
                  </span>
                  <span className="learn-lab__eq" aria-hidden="true">
                    =
                  </span>
                  <strong className={`learn-lab__result${phase === 'reveal' ? ' is-on' : ''}`}>
                    {phase === 'reveal' ? product : '?'}
                  </strong>
                </div>
                <div
                  className={`learn-lab__dots${product > 36 ? ' is-compact' : ''}${phase === 'hint' || phase === 'reveal' ? ' is-lit' : ''}`}
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
                      className={`learn-lab__dot${d % table === 0 && d !== 0 ? ' is-group' : ''}`}
                      style={{ width: size, height: size, animationDelay: `${Math.min(d, 24) * 18}ms` }}
                    />
                  ))}
                </div>
              </div>

              {showLumoTip || phase === 'hint' ? (
                <div className="learn-lab__lumo" aria-live="polite">
                  <Lumo state={lumo.state} intensity={lumo.intensity} size="sm" />
                  {hint ? <p className="learn-lab__tip">{hint}</p> : null}
                </div>
              ) : null}
            </div>

            {phase !== 'reveal' ? (
              <div className="learn-lab__answers">
                <AnswerGrid
                  options={options}
                  disabled={locked}
                  correctValue={product}
                  selectedValue={selected}
                  reveal={locked && selected !== null && selected !== product}
                  onSelect={onSelect}
                />
              </div>
            ) : (
              <p className="learn-lab__flash" role="status">
                {table} × {row} = {product}
              </p>
            )}

            <div className="learn-lab__nav">
              <button type="button" className="btn btn-ghost learn-lab__nav-btn" disabled={!canPrev} onClick={goPrev}>
                Anterior
              </button>
              <Link to="/missions/mates/tables/modes" className="btn btn-ghost learn-lab__nav-btn">
                Salir
              </Link>
            </div>
          </>
        )}
      </section>
    </AppShell>
  )
}
