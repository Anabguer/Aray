import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MONEY_MODE_LABELS, useMoneySession } from '@/money'
import { AppShell } from '@/components/AppShell'
import { DailyEnergyNote } from '@/components/DailyEnergyNote'
import { RoundSummary } from '@/components/RoundSummary'
import { soundEngine } from '@/sound/soundEngine'

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
  const hot = pct >= 70

  return (
    <AppShell title="RESUMEN" shortTitle="Resumen" showBack backTo="/missions/mates/money">
      <RoundSummary
        title={hot ? '¡Buen cambio!' : 'Sigue practicando'}
        meta={MONEY_MODE_LABELS[s.mode]}
        lumoState={hot ? 'celebration' : 'correct'}
        celebrate={hot}
        stats={[
          { value: `${s.correct}/${s.total}`, label: 'aciertos' },
          { value: s.bestStreak, label: 'racha' },
          { value: `${pct}%`, label: 'ronda' },
        ]}
        note={<DailyEnergyNote />}
        actions={
          <>
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
          </>
        }
      />
    </AppShell>
  )
}
