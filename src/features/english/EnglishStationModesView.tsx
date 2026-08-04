import { useNavigate } from 'react-router-dom'
import type { ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import {
  ENGLISH_MODE_LABELS,
  countActiveEnglishMisses,
} from '@/english'
import {
  ENGLISH_STATION_LABELS,
  englishStationPackIds,
  type EnglishStationId,
} from '@/feinetas/englishRegistry'
import { useProgress } from '@/progress/ProgressContext'
import '../languages/spelling/spelling.css'

const STATION_BLURB: Record<EnglishStationId, string> = {
  vocabulary: 'Comida, números, lugares y más en una partida',
  grammar: 'There is, preposiciones, presentes… mezclados',
  phrases: 'I can, rutinas y montar frases',
}

/**
 * Dentro de una estación: solo Mis fallos + Random.
 * Random mezcla todos los packs de la estación.
 */
export function EnglishStationModesView({
  stationId,
  onBack,
}: {
  stationId: EnglishStationId
  onBack?: () => void
}) {
  const navigate = useNavigate()
  const { playerId } = useProgress()
  const packIds = englishStationPackIds(stationId)
  const missCount = countActiveEnglishMisses(playerId ?? 'local', packIds)
  const title = ENGLISH_STATION_LABELS[stationId]
  const base = `/missions/english/${stationId}`

  const heroes: Array<{
    mode: 'review' | 'mix'
    art: ModeArtId
    className: string
    text: string
    tag: string
  }> = [
    {
      mode: 'review',
      art: 'mis-fallos',
      className: 'mode-poster--misses',
      text:
        missCount > 0
          ? `${missCount} pendientes · prioriza tus fallos`
          : 'Aún no hay fallos · juega Random y se irán guardando',
      tag: 'REPASO',
    },
    {
      mode: 'mix',
      art: 'spell-mix',
      className: 'mode-poster--random',
      text: STATION_BLURB[stationId],
      tag: 'DESTACADO',
    },
  ]

  return (
    <AppShell
      title={title.toUpperCase()}
      shortTitle={title}
      showBack
      onBack={onBack}
      backTo={onBack ? undefined : '/missions/english'}
    >
      <StageSelect
        kicker="Elige misión"
        title={title}
        heroes={heroes.map((m) => (
          <StageSlot
            key={m.mode}
            art={m.art}
            title={ENGLISH_MODE_LABELS[m.mode].toUpperCase()}
            text={m.text}
            className={m.className}
            tag={m.tag}
            featured
            locked={m.mode === 'review' && missCount === 0}
            onClick={
              m.mode === 'review' && missCount === 0
                ? undefined
                : () => navigate(`${base}/${m.mode}`)
            }
          />
        ))}
      />
    </AppShell>
  )
}
