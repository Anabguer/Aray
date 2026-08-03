import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { DailyEnergyNote } from '@/components/DailyEnergyNote'
import { RoundSummary } from '@/components/RoundSummary'
import { soundEngine } from '@/sound/soundEngine'

type SummaryState = {
  correct?: number
  total?: number
  title?: string
}

const WORDS_PATH = '/missions/languages/words'
const PLAY_PATH = '/missions/languages/words/monta-frase'

export function MontaFraseSummaryScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as SummaryState

  useEffect(() => {
    if (state.total == null) {
      navigate(WORDS_PATH, { replace: true })
      return
    }
    soundEngine.play('points-earned')
  }, [navigate, state.total])

  if (state.total == null) return null

  const correct = state.correct ?? 0
  const total = state.total
  const pct = Math.round((correct / Math.max(1, total)) * 100)
  const hot = pct >= 80

  return (
    <AppShell title="RESUMEN" shortTitle="Resumen" showBack backTo={WORDS_PATH}>
      <RoundSummary
        title={hot ? '¡Frases on fire!' : 'Buen repaso'}
        meta={state.title ?? 'Monta la frase'}
        lumoState={hot ? 'celebration' : 'correct'}
        celebrate={hot}
        stats={[
          { value: correct, label: 'aciertos' },
          { value: total, label: 'ronda' },
          { value: `${pct}%`, label: 'acierto' },
        ]}
        note={<DailyEnergyNote compact />}
        actions={
          <>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => navigate(PLAY_PATH)}
            >
              Otra ronda
            </button>
            <Link to={WORDS_PATH} className="btn btn-ghost btn-block">
              Otros modos
            </Link>
          </>
        }
      />
    </AppShell>
  )
}
