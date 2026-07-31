import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAlphabetSession, type AlphabetPlayMode } from '@/alphabet'
import { AppShell } from '@/components/AppShell'
import { energyCopy } from '@/config/rewardGoal'
import { Lumo } from '@/lumo/Lumo'
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

  return (
    <AppShell
      title="RESUMEN"
      shortTitle="Resumen"
      showBack
      backTo="/missions/languages/alphabet"
    >
      <section className="alphabet-summary" aria-labelledby="alphabet-summary-title">
        <Lumo state={crack || pct >= 80 ? 'celebration' : 'correct'} size="lg" />
        <h2 id="alphabet-summary-title" className="alphabet-summary__title">
          {title}
        </h2>
        <p className="alphabet-summary__meta">
          {MODE_LABEL[summary.mode]}
          {summary.statusLabel ? ` · ${summary.statusLabel}` : ''}
        </p>
        <ul className="alphabet-summary__stats">
          <li>
            <strong>{summary.correct}</strong>
            <span>aciertos</span>
          </li>
          <li>
            <strong>{summary.wrong}</strong>
            <span>fallos</span>
          </li>
          <li>
            <strong>{summary.bestStreak}</strong>
            <span>mejor racha</span>
          </li>
          <li>
            <strong>{summary.roundScore ?? Math.round((pct / 100) * 10)}/10</strong>
            <span>ronda</span>
          </li>
        </ul>
        {(summary.xpEarned || summary.coinsEarned || summary.rewardPointsEarned) ? (
          <p className="alphabet-summary__rewards">
            {summary.xpEarned ? `+${summary.xpEarned} XP` : null}
            {summary.xpEarned && summary.coinsEarned ? ' · ' : null}
            {summary.coinsEarned ? `+${summary.coinsEarned} monedas` : null}
            {(summary.xpEarned || summary.coinsEarned) && summary.rewardPointsEarned
              ? ' · '
              : null}
            {summary.rewardPointsEarned
              ? `+${summary.rewardPointsEarned} energía`
              : null}
          </p>
        ) : null}
        {summary.rewardDailyComplete && !summary.rewardPointsEarned ? (
          <p className="alphabet-summary__review" role="status">
            {energyCopy.playForFun}
          </p>
        ) : null}
        {summary.recommendReview ? (
          <p className="alphabet-summary__review" role="status">
            Este modo pide un repaso. Sin prisa: otra ronda y se asienta.
          </p>
        ) : null}
        <div className="alphabet-summary__actions">
          <button type="button" className="btn btn-primary btn-block" onClick={repeat}>
            Repetir
          </button>
          <Link to="/missions/languages/alphabet" className="btn btn-ghost btn-block">
            Otros modos
          </Link>
          <Link to="/missions/languages" className="btn btn-ghost btn-block">
            Mundo de lenguas
          </Link>
        </div>
      </section>
    </AppShell>
  )
}
