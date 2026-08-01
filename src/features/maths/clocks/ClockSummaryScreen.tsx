import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { DailyEnergyNote } from '@/components/DailyEnergyNote'
import { RoundSummary } from '@/components/RoundSummary'
import type { RoundSummaryStat } from '@/components/RoundSummary'
import { useClockSession } from '@/clock/ClockSessionContext'
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
  const hot = pct >= 80
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

  const stats: RoundSummaryStat[] = [
    {
      value: summary.correct,
      label: summary.mode === 'match' ? 'pares bien' : 'aciertos',
    },
    { value: summary.bestStreak, label: 'mejor racha' },
  ]
  if (summary.mode === 'train') {
    stats.push({ value: `${pct}%`, label: 'de la ronda' })
  }

  return (
    <AppShell title="RESUMEN" shortTitle="Resumen" showBack backTo="/missions/mates/clocks">
      <RoundSummary
        title={
          hot
            ? lang === 'ca'
              ? 'Genial!'
              : '¡Genial!'
            : lang === 'ca'
              ? 'Bon entrenament'
              : 'Buen entrenamiento'
        }
        meta={`${modeLabel} · ${langLabel}`}
        lumoState={hot ? 'celebration' : 'correct'}
        celebrate={hot}
        stats={stats}
        note={<DailyEnergyNote compact />}
        actions={
          <>
            <button type="button" className="btn btn-primary btn-block" onClick={repeat}>
              Repetir
            </button>
            <Link to="/missions/mates/clocks" className="btn btn-ghost btn-block">
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
