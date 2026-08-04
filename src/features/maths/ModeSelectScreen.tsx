import { useNavigate } from 'react-router-dom'
import type { ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { IconReview } from '@/components/Icons'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
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
  locked?: boolean
  onClick?: () => void
}

/** Orden: Mis fallos → Random → Entrena. Aprende/Reto/Empareja van en Random. */
export function ModeSelectScreen() {
  const navigate = useNavigate()
  const { progress } = useProgress()
  const { selection, setSelection, setPendingQueue, setActiveMode, setLastResult } =
    usePlaySession()

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

  function startMisses() {
    if (!canPracticeMisses) return
    setLastResult(null)
    const { queue, usedFallbackMix } = buildMissesQueue(progress)
    setActiveMode(usedFallbackMix ? 'train' : 'misses')
    setPendingQueue(queue)
    navigate('/missions/mates/tables/train', {
      state: { fallbackMix: usedFallbackMix },
    })
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
    if (mission.kind === 'learn') {
      setSelection({ tables: mission.tables, mix: mission.mix })
      setActiveMode('learn')
      navigate('/missions/mates/tables/learn')
      return
    }
    if (mission.kind === 'challenge') {
      setSelection({ tables: mission.tables, mix: mission.mix })
      setActiveMode('challenge')
      setPendingQueue(null)
      navigate('/missions/mates/tables/challenge')
      return
    }
    setSelection({ tables: mission.tables, mix: mission.mix })
    setActiveMode('train')
    setPendingQueue(buildTrainQueue(mission.tables, progress))
    navigate('/missions/mates/tables/train')
  }

  const heroes: Poster[] = [
    {
      id: 'misses',
      art: 'mis-fallos',
      title: 'MIS FALLOS',
      text: canPracticeMisses
        ? 'Refuerza lo difícil'
        : 'Aún no hay fallos · juega y se irán guardando',
      className: 'mode-poster--misses',
      tag: 'REPASO',
      locked: !canPracticeMisses,
      onClick: canPracticeMisses ? startMisses : undefined,
    },
    {
      id: 'random',
      art: 'sorpresa',
      title: 'RANDOM',
      text: 'Aprende, reto o empareja · Lumo elige',
      className: 'mode-poster--random',
      tag: 'DESTACADO',
      onClick: startRandom,
    },
    {
      id: 'train',
      art: 'entrena',
      title: 'ENTRENA',
      text: '10 preguntas · Gana energía',
      className: 'mode-poster--train',
      tag: 'ENTRENA',
      onClick: startTrain,
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
            locked={m.locked}
            onClick={m.onClick}
          />
        ))}
        heroesCols={3}
      />
    </AppShell>
  )
}
