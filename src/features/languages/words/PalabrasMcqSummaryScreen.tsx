import { useEffect } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { DailyEnergyNote } from '@/components/DailyEnergyNote'
import { RoundSummary } from '@/components/RoundSummary'
import {
  isPalabrasMcqProductId,
  PALABRAS_MCQ_LABELS,
  type PalabrasMcqProductId,
} from '@/minigames/adapters/palabrasMcq'
import { soundEngine } from '@/sound/soundEngine'

type SummaryState = {
  correct?: number
  total?: number
  title?: string
  productId?: string
}

const WORDS_PATH = '/missions/languages/words'

export function PalabrasMcqSummaryScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { productId: rawId } = useParams<{ productId: string }>()
  const state = (location.state ?? {}) as SummaryState
  const productId: PalabrasMcqProductId | null = isPalabrasMcqProductId(rawId ?? '')
    ? (rawId as PalabrasMcqProductId)
    : isPalabrasMcqProductId(state.productId ?? '')
      ? (state.productId as PalabrasMcqProductId)
      : null

  useEffect(() => {
    if (state.total == null || !productId) {
      navigate(WORDS_PATH, { replace: true })
      return
    }
    soundEngine.play('points-earned')
  }, [navigate, state.total, productId])

  if (state.total == null || !productId) return null

  const correct = state.correct ?? 0
  const total = state.total
  const pct = Math.round((correct / Math.max(1, total)) * 100)
  const hot = pct >= 80
  const title = state.title ?? PALABRAS_MCQ_LABELS[productId]
  const playPath = `/missions/languages/words/${productId}`

  return (
    <AppShell title="RESUMEN" shortTitle="Resumen" showBack backTo={WORDS_PATH}>
      <RoundSummary
        title={hot ? '¡Palabras on fire!' : 'Buen repaso'}
        meta={title}
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
              onClick={() => navigate(playPath)}
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
