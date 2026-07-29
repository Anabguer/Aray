import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { IconReview } from '@/components/Icons'
import { ModeIcon } from '@/components/ModeIcon'
import { MuteToggle } from '@/components/quiz/QuizWidgets'
import { challengeModeConfig } from '@/config/playConfig'
import { hasSavedMisses, pickRandomMission } from '@/math/randomMission'
import { buildMissesQueue, buildTrainQueue } from '@/math/selector'
import { tableStatus } from '@/math/tableMastery'
import { usePlaySession } from '@/progress/PlayContext'
import { useProgress } from '@/progress/ProgressContext'

export function ModeSelectScreen() {
  const navigate = useNavigate()
  const { progress, setSoundMuted } = useProgress()
  const { selection, setSelection, setPendingQueue, setActiveMode, setLastResult } = usePlaySession()

  const label = selection.mix
    ? 'Mezcla 2–9'
    : selection.tables.length === 1
      ? `Tabla del ${selection.tables[0]}`
      : `${selection.tables.length} niveles`

  const canPracticeMisses = hasSavedMisses(progress)
  const reviewTables = selection.tables.filter((n) => {
    const t = progress.tables[String(n)]
    return t ? tableStatus(t).recommendPractice : false
  })
  const reviewHint =
    reviewTables.length === 1
      ? `La tabla del ${reviewTables[0]} necesita un repaso`
      : reviewTables.length > 1
        ? `Las tablas del ${reviewTables.join(', ')} necesitan un repaso`
        : ''

  function startTrain() {
    setLastResult(null)
    setActiveMode('train')
    setPendingQueue(buildTrainQueue(selection.tables, progress))
    navigate('/missions/mates/tables/train')
  }

  function startChallenge() {
    setLastResult(null)
    setActiveMode('challenge')
    setPendingQueue(null)
    navigate('/missions/mates/tables/challenge')
  }

  function startMatch() {
    const table = selection.tables[0] ?? 7
    setSelection({ tables: [table], mix: false })
    setLastResult(null)
    setActiveMode('match')
    navigate('/missions/mates/tables/match')
  }

  function startMisses() {
    if (!canPracticeMisses) return
    setLastResult(null)
    const { queue, usedFallbackMix } = buildMissesQueue(progress)
    setActiveMode(usedFallbackMix ? 'train' : 'misses')
    setPendingQueue(queue)
    navigate('/missions/mates/tables/train', { state: { fallbackMix: usedFallbackMix } })
  }

  function startRandom() {
    const mission = pickRandomMission(progress)
    if (!mission) return
    setLastResult(null)
    if (mission.kind === 'misses') {
      startMisses()
      return
    }
    if (mission.kind === 'match') {
      setSelection({ tables: [mission.table], mix: false })
      setActiveMode('match')
      navigate('/missions/mates/tables/match')
      return
    }
    setSelection({ tables: mission.tables, mix: mission.mix })
    setActiveMode('train')
    setPendingQueue(buildTrainQueue(mission.tables, progress))
    navigate('/missions/mates/tables/train')
  }

  return (
    <AppShell
      title="Modo"
      showBack
      backTo="/missions/mates/tables"
      trailing={
        <MuteToggle muted={progress.soundMuted} onToggle={() => setSoundMuted(!progress.soundMuted)} />
      }
    >
      <section className="mode-select mode-select--lobby">
        <p className="mode-select__badge">{label}</p>
        {reviewHint ? (
          <p className="review-notice" role="status">
            <IconReview className="review-notice__icon" />
            <span>{reviewHint}</span>
          </p>
        ) : null}
        <div className="mode-cards mode-cards--posters">
          <Link to="/missions/mates/tables/learn" className="mode-card mode-card--learn">
            <ModeIcon mode="aprende" />
            <span className="mode-card__body">
              <span className="mode-card__title">Aprende</span>
              <span className="mode-card__eyebrow">Sin tiempo · Con pistas</span>
            </span>
          </Link>
          <button type="button" className="mode-card mode-card--train" onClick={startTrain}>
            <ModeIcon mode="entrena" />
            <span className="mode-card__body">
              <span className="mode-card__title">Entrena</span>
              <span className="mode-card__eyebrow">10 preguntas · +energía</span>
            </span>
          </button>
          <button type="button" className="mode-card mode-card--challenge" onClick={startChallenge}>
            <ModeIcon mode="reto-rapido" />
            <span className="mode-card__body">
              <span className="mode-card__title">Reto rápido</span>
              <span className="mode-card__eyebrow">
                {challengeModeConfig.durationSec}s · XP ×{challengeModeConfig.xpMultiplier}
              </span>
            </span>
          </button>
          <button type="button" className="mode-card mode-card--match" onClick={startMatch}>
            <ModeIcon mode="empareja" />
            <span className="mode-card__body">
              <span className="mode-card__title">Empareja</span>
              <span className="mode-card__eyebrow">Une las piezas · +energía</span>
            </span>
          </button>
          {canPracticeMisses ? (
            <button type="button" className="mode-card mode-card--misses" onClick={startMisses}>
              <ModeIcon mode="mis-fallos" />
              <span className="mode-card__body">
                <span className="mode-card__title">Mis fallos</span>
                <span className="mode-card__eyebrow">Refuerza lo difícil</span>
              </span>
            </button>
          ) : null}
          <button type="button" className="mode-card mode-card--random mode-card--featured" onClick={startRandom}>
            <ModeIcon mode="mision-random" />
            <span className="mode-card__body">
              <span className="mode-card__title">Misión random</span>
              <span className="mode-card__eyebrow">Sorpresa</span>
            </span>
          </button>
        </div>
      </section>
    </AppShell>
  )
}
