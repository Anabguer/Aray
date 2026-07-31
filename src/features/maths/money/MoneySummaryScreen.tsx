import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MONEY_MODE_LABELS, useMoneySession } from '@/money'
import { AppShell } from '@/components/AppShell'
import { Lumo } from '@/lumo/Lumo'
import { soundEngine } from '@/sound/soundEngine'
import './money.css'

export function MoneySummaryScreen() {
  const navigate = useNavigate()
  const { lastSummary, setLastSummary } = useMoneySession()

  useEffect(() => {
    if (!lastSummary) {
      navigate('/missions/mates/money', { replace: true })
      return
    }
    soundEngine.play('points-earned')
  }, [lastSummary, navigate])

  if (!lastSummary) return null
  const s = lastSummary
  const pct = Math.round((s.correct / Math.max(1, s.total)) * 100)

  return (
    <AppShell title="RESUMEN" shortTitle="Resumen" showBack backTo="/missions/mates/money">
      <section className="money-summary">
        <Lumo state={pct >= 70 ? 'celebration' : 'correct'} size="lg" />
        <h2>{pct >= 70 ? '¡Buen cambio!' : 'Sigue practicando'}</h2>
        <p>{MONEY_MODE_LABELS[s.mode]}</p>
        <p>
          {s.correct}/{s.total} · racha {s.bestStreak}
        </p>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => {
            const mode = s.mode
            setLastSummary(null)
            navigate(`/missions/mates/money/${mode}`)
          }}
        >
          Otra ronda
        </button>
        <Link to="/missions/mates/money" className="btn btn-ghost btn-block">
          Otros modos
        </Link>
      </section>
    </AppShell>
  )
}
