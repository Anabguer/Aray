import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SPELL_MODE_LABELS, useSpellSession } from '@/spelling'
import { AppShell } from '@/components/AppShell'
import { DailyEnergyNote } from '@/components/DailyEnergyNote'
import { RoundSummary } from '@/components/RoundSummary'
import { soundEngine } from '@/sound/soundEngine'

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
  const hot = pct >= 80

  return (
    <AppShell title="RESUMEN" shortTitle="Resumen" showBack backTo="/missions/languages/spelling">
      <RoundSummary
        title={hot ? '¡Ortografía on fire!' : 'Buen repaso'}
        meta={SPELL_MODE_LABELS[s.mode]}
        lumoState={hot ? 'celebration' : 'correct'}
        celebrate={hot}
        stats={[
          { value: s.correct, label: 'aciertos' },
          { value: s.bestStreak, label: 'racha' },
          { value: `${pct}%`, label: 'ronda' },
        ]}
        note={<DailyEnergyNote compact />}
        actions={
          <>
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
          </>
        }
      />
    </AppShell>
  )
}
