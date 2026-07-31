import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SPELL_MODE_LABELS, useSpellSession } from '@/spelling'
import { AppShell } from '@/components/AppShell'
import { DailyEnergyNote } from '@/components/DailyEnergyNote'
import { Lumo } from '@/lumo/Lumo'
import { soundEngine } from '@/sound/soundEngine'
import './spelling.css'

export function SpellSummaryScreen() {
  const navigate = useNavigate()
  const { lastSummary, setLastSummary } = useSpellSession()

  useEffect(() => {
    if (!lastSummary) {
      navigate('/missions/languages/spelling', { replace: true })
      return
    }
    soundEngine.play('points-earned')
  }, [lastSummary, navigate])

  if (!lastSummary) return null
  const s = lastSummary
  const pct = Math.round((s.correct / Math.max(1, s.total)) * 100)

  return (
    <AppShell title="RESUMEN" shortTitle="Resumen" showBack backTo="/missions/languages/spelling">
      <section className="spell-summary">
        <Lumo state={pct >= 80 ? 'celebration' : 'correct'} size="lg" />
        <h2>{pct >= 80 ? '¡Ortografía on fire!' : 'Buen repaso'}</h2>
        <p className="spell-summary__meta">{SPELL_MODE_LABELS[s.mode]}</p>
        <ul className="spell-summary__stats">
          <li>
            <strong>{s.correct}</strong>
            <span>aciertos</span>
          </li>
          <li>
            <strong>{s.bestStreak}</strong>
            <span>racha</span>
          </li>
          <li>
            <strong>{pct}%</strong>
            <span>ronda</span>
          </li>
        </ul>
        <DailyEnergyNote className="spell-summary__meta" />
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => {
            const mode = s.mode
            setLastSummary(null)
            navigate(`/missions/languages/spelling/${mode}`)
          }}
        >
          Otra ronda
        </button>
        <Link to="/missions/languages/spelling" className="btn btn-ghost btn-block">
          Otros modos
        </Link>
      </section>
    </AppShell>
  )
}
