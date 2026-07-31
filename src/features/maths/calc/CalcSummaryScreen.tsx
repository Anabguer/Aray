import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CALC_MODE_LABELS, useCalcSession } from '@/calc'
import { AppShell } from '@/components/AppShell'
import { Lumo } from '@/lumo/Lumo'
import { soundEngine } from '@/sound/soundEngine'

export function CalcSummaryScreen() {
  const navigate = useNavigate()
  const { lastSummary, setLastSummary, lastMode } = useCalcSession()

  useEffect(() => {
    if (!lastSummary) {
      navigate('/missions/mates/calc', { replace: true })
      return
    }
    soundEngine.play('points-earned')
  }, [lastSummary, navigate])

  if (!lastSummary) return null
  const summary = lastSummary
  const pct =
    summary.total > 0 ? Math.round((summary.correct / summary.total) * 100) : 0

  function repeat() {
    const mode = summary.mode
    setLastSummary(null)
    navigate(`/missions/mates/calc/${mode}`)
  }

  return (
    <AppShell title="RESUMEN" shortTitle="Resumen" showBack backTo="/missions/mates/calc">
      <section className="calc-summary">
        <Lumo state={pct >= 70 ? 'celebration' : 'correct'} size="lg" />
        <h2 className="calc-summary__title">
          {pct >= 70 ? '¡Rayo mental!' : 'Buen calentamiento'}
        </h2>
        <p className="calc-summary__meta">
          {CALC_MODE_LABELS[summary.mode]} · {summary.durationSec}s
        </p>
        <ul className="calc-summary__stats">
          <li>
            <strong>{summary.correct}</strong>
            <span>aciertos</span>
          </li>
          <li>
            <strong>{summary.total}</strong>
            <span>intentos</span>
          </li>
          <li>
            <strong>{summary.bestStreak}</strong>
            <span>mejor racha</span>
          </li>
        </ul>
        <div className="calc-summary__actions">
          <button type="button" className="btn btn-primary btn-block" onClick={repeat}>
            Otra ronda
          </button>
          {lastMode && lastMode !== summary.mode ? null : null}
          <Link to="/missions/mates/calc" className="btn btn-ghost btn-block">
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
