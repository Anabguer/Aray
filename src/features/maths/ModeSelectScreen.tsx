import { useNavigate } from 'react-router-dom'
import type { ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { IconReview } from '@/components/Icons'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
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
  const head = tables
    .slice(0, -1)
    .map((n) => `del ${n}`)
    .join(', ')
  return `Tablas ${head} y del ${tables[tables.length - 1]}`
}

type Poster = {
  id: string
  art: ModeArtId
  title: string
  text: string
  className: string
  tag: string
  to?: string
  onClick?: () => void
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

  const heroes: Poster[] = [
    {
      id: 'train',
      art: 'entrena',
      title: 'ENTRENA',
      text: '10 preguntas · Gana energía',
      className: 'mode-poster--train',
      tag: 'DESTACADO',
      onClick: startTrain,
    },
    {
      id: 'challenge',
      art: 'reto-rapido',
      title: 'RETO RÁPIDO',
      text: `${challengeModeConfig.durationSec} segundos · XP extra`,
      className: 'mode-poster--challenge',
      tag: 'RÁPIDO',
      onClick: startChallenge,
    },
  ]

  const roster: Poster[] = [
    {
      id: 'learn',
      art: 'aprende',
      title: 'APRENDE',
      text: 'Mira, toca y descubre',
      className: 'mode-poster--learn',
      tag: '01',
      to: '/missions/mates/tables/learn',
    },
    {
      id: 'match',
      art: 'empareja',
      title: 'EMPAREJA',
      text: 'Encuentra las parejas',
      className: 'mode-poster--match',
      tag: '02',
      onClick: startMatch,
    },
    ...(canPracticeMisses
      ? [
          {
            id: 'misses',
            art: 'mis-fallos' as ModeArtId,
            title: 'MIS FALLOS',
            text: 'Refuerza lo difícil',
            className: 'mode-poster--misses',
            tag: '03',
            onClick: startMisses,
          },
        ]
      : []),
    {
      id: 'random',
      art: 'sorpresa',
      title: 'RANDOM',
      text: 'Lumo elige por ti',
      className: 'mode-poster--random',
      tag: canPracticeMisses ? '04' : '03',
      onClick: startRandom,
    },
  ]

  return (
    <AppShell title="Elige tu modo" shortTitle="MODO" showBack backTo="/missions/mates/tables">
      <StageSelect
        note={
          <>
            <span>{subtitle}</span>
            {reviewHint ? (
              <p className="review-notice" role="status" style={{ marginTop: '0.55rem' }}>
                <IconReview className="review-notice__icon" />
                <span>{reviewHint}</span>
              </p>
            ) : null}
          </>
        }
        heroes={heroes.map((m) => (
          <StageSlot
            key={m.id}
            art={m.art}
            title={m.title}
            text={m.text}
            className={m.className}
            tag={m.tag}
            featured
            to={m.to}
            onClick={m.onClick}
          />
        ))}
        roster={roster.map((m) => (
          <StageSlot
            key={m.id}
            art={m.art}
            title={m.title}
            text={m.text}
            className={m.className}
            tag={m.tag}
            to={m.to}
            onClick={m.onClick}
          />
        ))}
        rosterCols={roster.length >= 4 ? 4 : roster.length === 3 ? 3 : 2}
      />
    </AppShell>
  )
}
