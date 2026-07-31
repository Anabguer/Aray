import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { useClockSession } from '@/clock/ClockSessionContext'
import { Lumo } from '@/lumo/Lumo'
import { soundEngine } from '@/sound/soundEngine'

export function ClockSummaryScreen() {
  const navigate = useNavigate()
  const { lastSummary, setLastSummary, lang } = useClockSession()

  useEffect(() => {
    if (!lastSummary) {
      navigate('/missions/mates/clocks', { replace: true })
      return
    }
    soundEngine.play('points-earned')
  }, [lastSummary, navigate])

  if (!lastSummary) return null
  const summary = lastSummary

  const pct =
    summary.total > 0 ? Math.round((summary.correct / summary.total) * 100) : 0
  const modeLabel =
    summary.mode === 'match'
      ? 'Empareja'
      : summary.mode === 'learn'
        ? 'Aprende'
        : 'Entrena'
  const langLabel = summary.lang === 'ca' ? 'Català' : 'Castellano'

  function repeat() {
    const mode = summary.mode
    setLastSummary(null)
    if (mode === 'match') {
      navigate('/missions/mates/clocks/match')
      return
    }
    navigate('/missions/mates/clocks/train')
  }

  return (
    <AppShell title="RESUMEN" shortTitle="Resumen" showBack backTo="/missions/mates/clocks">
      <section className="clock-summary" aria-labelledby="clock-summary-title">
        <Lumo state={pct >= 80 ? 'celebration' : 'correct'} size="lg" />
        <h2 id="clock-summary-title" className="clock-summary__title">
          {pct >= 80
            ? lang === 'ca'
              ? 'Genial!'
              : '¡Genial!'
            : lang === 'ca'
              ? 'Bon entrenament'
              : 'Buen entrenamiento'}
        </h2>
        <p className="clock-summary__meta">
          {modeLabel} · {langLabel}
        </p>
        <ul className="clock-summary__stats">
          <li>
            <strong>{summary.correct}</strong>
            <span>{summary.mode === 'match' ? 'pares bien' : 'aciertos'}</span>
          </li>
          <li>
            <strong>{summary.bestStreak}</strong>
            <span>mejor racha</span>
          </li>
          {summary.mode === 'train' ? (
            <li>
              <strong>{pct}%</strong>
              <span>de la ronda</span>
            </li>
          ) : null}
        </ul>
        <div className="clock-summary__actions">
          <button type="button" className="btn btn-primary btn-block" onClick={repeat}>
            Repetir
          </button>
          <Link to="/missions/mates/clocks" className="btn btn-ghost btn-block">
            Otros modos
          </Link>
          <Link to="/missions/mates" className="btn btn-ghost btn-block">
            Mundo de mates
          </Link>
        </div>
      </section>
    </AppShell>
  )
}
