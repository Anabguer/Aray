import { Link, useNavigate } from 'react-router-dom'
import { modeArtUrl, type ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { IconReview } from '@/components/Icons'
import { challengeModeConfig } from '@/config/playConfig'
import { hasSavedMisses, pickRandomMission } from '@/math/randomMission'
import { buildMissesQueue, buildTrainQueue } from '@/math/selector'
import { tableStatus } from '@/math/tableMastery'
import { usePlaySession, type TablesSelection } from '@/progress/PlayContext'
import { useProgress } from '@/progress/ProgressContext'

function selectionSubtitle(selection: TablesSelection): string {
  if (selection.mix) return 'Tablas mezcladas'
  const tables = selection.tables
  if (tables.length <= 1) return `Tabla del ${tables[0] ?? 7}`
  if (tables.length === 2) return `Tablas del ${tables[0]} y del ${tables[1]}`
  const head = tables.slice(0, -1).map((n) => `del ${n}`).join(', ')
  return `Tablas ${head} y del ${tables[tables.length - 1]}`
}

function ModePoster({
  art,
  title,
  text,
  className,
  onClick,
  to,
}: {
  art: ModeArtId
  title: string
  text: string
  className: string
  onClick?: () => void
  to?: string
}) {
  const body = (
    <span className="mode-poster__art">
      <img
        src={modeArtUrl(art)}
        alt=""
        className="mode-poster__img"
        width={512}
        height={512}
        draggable={false}
        decoding="async"
      />
      <span className="mode-poster__overlay">
        <span className="mode-poster__title">{title}</span>
        <span className="mode-poster__text">{text}</span>
      </span>
    </span>
  )

  const label = `${title}. ${text}`

  if (to) {
    return (
      <Link to={to} className={`mode-poster ${className}`} aria-label={label}>
        {body}
      </Link>
    )
  }

  return (
    <button type="button" className={`mode-poster ${className}`} onClick={onClick} aria-label={label}>
      {body}
    </button>
  )
}

export function ModeSelectScreen() {
  const navigate = useNavigate()
  const { progress } = useProgress()
  const { selection, setSelection, setPendingQueue, setActiveMode, setLastResult } = usePlaySession()

  const subtitle = selectionSubtitle(selection)

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
      title="ELIGE TU MODO"
      showBack
      backTo="/missions/mates/tables"
    >
      <section className="mode-select mode-select--lobby" aria-label="ELIGE TU MODO">
        <header className="mode-select__head">
          <p className="mode-select__tables">{subtitle}</p>
        </header>

        {reviewHint ? (
          <p className="review-notice" role="status">
            <IconReview className="review-notice__icon" />
            <span>{reviewHint}</span>
          </p>
        ) : null}

        <div className="mode-posters">
          <ModePoster
            art="aprende"
            title="APRENDE"
            text="Mira, toca y descubre"
            className="mode-poster--learn"
            to="/missions/mates/tables/learn"
          />
          <ModePoster
            art="entrena"
            title="ENTRENA"
            text="10 preguntas · Gana energía"
            className="mode-poster--train"
            onClick={startTrain}
          />
          <ModePoster
            art="reto-rapido"
            title="RETO RÁPIDO"
            text={`${challengeModeConfig.durationSec} segundos · XP extra`}
            className="mode-poster--challenge"
            onClick={startChallenge}
          />
          <ModePoster
            art="empareja"
            title="EMPAREJA"
            text="Encuentra las parejas"
            className="mode-poster--match"
            onClick={startMatch}
          />
          {canPracticeMisses ? (
            <ModePoster
              art="mis-fallos"
              title="MIS FALLOS"
              text="Refuerza lo difícil"
              className="mode-poster--misses"
              onClick={startMisses}
            />
          ) : null}
          <ModePoster
            art="sorpresa"
            title="SORPRESA"
            text="Lumo elige por ti"
            className="mode-poster--random"
            onClick={startRandom}
          />
        </div>
      </section>
    </AppShell>
  )
}
