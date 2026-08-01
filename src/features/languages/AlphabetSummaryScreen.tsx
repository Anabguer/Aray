import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAlphabetSession, type AlphabetPlayMode } from '@/alphabet'
import { AppShell } from '@/components/AppShell'
import { RoundSummary } from '@/components/RoundSummary'
import { DailyEnergyNote } from '@/components/DailyEnergyNote'
import { soundEngine } from '@/sound/soundEngine'

const MODE_LABEL: Record<AlphabetPlayMode, string> = {
  missing: 'Letra que falta',
  neighbor: 'Siguiente / anterior',
  'order-letters': 'Ordena letras',
  'order-words': 'Ordena palabras',
  random: 'Random',
}

export function AlphabetSummaryScreen() {
  const navigate = useNavigate()
  const { lastSummary, setLastSummary } = useAlphabetSession()

  useEffect(() => {
    if (!lastSummary) {
      navigate('/missions/languages/alphabet', { replace: true })
      return
    }
    soundEngine.play('points-earned')
  }, [lastSummary, navigate])

  if (!lastSummary) return null
  const summary = lastSummary

  const pct =
    summary.total > 0 ? Math.round((summary.correct / summary.total) * 100) : 0
  const crack = pct >= 100
  const hot = crack || pct >= 80
  const title = crack
    ? '¡Crack!'
    : pct >= 80
      ? '¡Genial!'
      : summary.recommendReview
        ? 'Conviene repasar'
        : 'Buen entrenamiento'

  function repeat() {
    const mode = summary.mode
    setLastSummary(null)
    navigate(`/missions/languages/alphabet/${mode}`)
  }

  const note = (
    <>
      {summary.xpEarned || summary.rewardPointsEarned ? (
        <p>
          {summary.xpEarned ? `+${summary.xpEarned} XP` : null}
          {summary.xpEarned && summary.rewardPointsEarned ? ' · ' : null}
          {summary.rewardPointsEarned
            ? `+${summary.rewardPointsEarned} energía`
            : null}
        </p>
      ) : null}
      {summary.rewardDailyComplete && !summary.rewardPointsEarned ? (
        <DailyEnergyNote compact />
      ) : null}
      {summary.recommendReview ? (
        <p role="status">
          Este modo pide un repaso. Sin prisa: otra ronda y se asienta.
        </p>
      ) : null}
    </>
  )

  return (
    <AppShell
      title="RESUMEN"
      shortTitle="Resumen"
      showBack
      backTo="/missions/languages/alphabet"
    >
      <RoundSummary
        title={title}
        titleId="alphabet-summary-title"
        meta={
          <>
            {MODE_LABEL[summary.mode]}
            {summary.statusLabel ? ` · ${summary.statusLabel}` : ''}
          </>
        }
        lumoState={hot ? 'celebration' : 'correct'}
        celebrate={hot}
        stats={[
          { value: summary.correct, label: 'aciertos' },
          { value: summary.wrong, label: 'fallos' },
          { value: summary.bestStreak, label: 'mejor racha' },
          {
            value: `${summary.roundScore ?? Math.round((pct / 100) * 10)}/10`,
            label: 'ronda',
          },
        ]}
        note={note}
        actions={
          <>
            <button type="button" className="btn btn-primary btn-block" onClick={repeat}>
              Repetir
            </button>
            <Link to="/missions/languages/alphabet" className="btn btn-ghost btn-block">
              Otros modos
            </Link>
            <Link to="/missions/languages" className="btn btn-ghost btn-block">
              Mundo de lenguas
            </Link>
          </>
        }
      />
    </AppShell>
  )
}
