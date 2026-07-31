import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CALC_MODE_LABELS, useCalcSession } from '@/calc'
import { AppShell } from '@/components/AppShell'
import { DailyEnergyNote } from '@/components/DailyEnergyNote'
import { RoundSummary } from '@/components/RoundSummary'
import { soundEngine } from '@/sound/soundEngine'

export function CalcSummaryScreen() {
  const navigate = useNavigate()
  const { lastSummary, setLastSummary } = useCalcSession()

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
  const hot = pct >= 70

  function repeat() {
    const mode = summary.mode
    setLastSummary(null)
    navigate(`/missions/mates/calc/${mode}`)
  }

  return (
    <AppShell title="RESUMEN" shortTitle="Resumen" showBack backTo="/missions/mates/calc">
      <RoundSummary
        title={hot ? '¡Rayo mental!' : 'Buen calentamiento'}
        meta={`${CALC_MODE_LABELS[summary.mode]} · ${summary.durationSec}s`}
        lumoState={hot ? 'celebration' : 'correct'}
        celebrate={hot}
        stats={[
          { value: summary.correct, label: 'aciertos' },
          { value: summary.total, label: 'intentos' },
          { value: summary.bestStreak, label: 'mejor racha' },
        ]}
        note={<DailyEnergyNote />}
        actions={
          <>
            <button type="button" className="btn btn-primary btn-block" onClick={repeat}>
              Otra ronda
            </button>
            <Link to="/missions/mates/calc" className="btn btn-ghost btn-block">
              Otros modos
            </Link>
            <Link to="/missions/mates" className="btn btn-ghost btn-block">
              Mundo de mates
            </Link>
          </>
        }
      />
    </AppShell>
  )
}
