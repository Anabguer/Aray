import { Navigate, useNavigate, useParams } from 'react-router-dom'
import type { ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import {
  ENGLISH_MODE_LABELS,
  countActiveEnglishMisses,
  type EnglishPlayMode,
} from '@/english'
import {
  ENGLISH_PACK_LABELS,
  englishPackSupportsSceneMatch,
  isEnglishHubPackId,
} from '@/feinetas/englishRegistry'
import { canBuildEnglishIntruder } from '@/minigames/adapters/englishIntruder'
import { useProgress } from '@/progress/ProgressContext'
import '../languages/spelling/spelling.css'

type EnglishPoster = {
  mode: EnglishPlayMode
  art: ModeArtId
  className: string
  text: string
  tag: string
}

const HEROES: EnglishPoster[] = [
  {
    mode: 'review',
    art: 'mis-fallos',
    className: 'mode-poster--misses',
    text: 'Practica las que sueles fallar',
    tag: 'REPASO',
  },
  {
    mode: 'mix',
    art: 'spell-mix',
    className: 'mode-poster--random',
    text: 'Mezcla de modos en una partida',
    tag: 'DESTACADO',
  },
]

const ROSTER: EnglishPoster[] = [
  {
    mode: 'match',
    art: 'empareja',
    className: 'mode-poster--match',
    text: 'Une la frase con la escena',
    tag: '00',
  },
  {
    mode: 'meaning',
    art: 'spell-correct',
    className: 'mode-poster--train',
    text: 'Palabra en inglés → significado',
    tag: '01',
  },
  {
    mode: 'translate',
    art: 'spell-complete',
    className: 'mode-poster--challenge',
    text: 'Glosa en español → inglés',
    tag: '02',
  },
  {
    mode: 'intruder',
    art: 'spell-intruder',
    className: 'mode-poster--challenge',
    text: 'Tres del grupo; una no encaja',
    tag: '03',
  },
  {
    mode: 'missing',
    art: 'spell-missing',
    className: 'mode-poster--learn',
    text: 'Completa la letra que falta',
    tag: '04',
  },
]

/** UI de modos; usable por ruta o embebida en el hub (sin cambio de ruta). */
export function EnglishModeSelectView({
  packId,
  onBack,
}: {
  packId: string
  onBack?: () => void
}) {
  const navigate = useNavigate()
  const { playerId } = useProgress()
  const missCount = countActiveEnglishMisses(playerId ?? 'local', packId)
  const base = `/missions/english/pack/${packId}`
  const title = ENGLISH_PACK_LABELS[packId] ?? packId
  const showIntruder = canBuildEnglishIntruder(packId)
  const showMatch = englishPackSupportsSceneMatch(packId)
  const heroes = HEROES.filter((m) => m.mode !== 'review' || missCount > 0)
  const roster = ROSTER.filter((m) => {
    if (m.mode === 'intruder' && !showIntruder) return false
    if (m.mode === 'match' && !showMatch) return false
    return true
  })

  return (
    <AppShell
      title={title.toUpperCase()}
      shortTitle={title}
      showBack
      onBack={onBack}
      backTo={onBack ? undefined : '/missions/english'}
    >
      <StageSelect
        heroes={heroes.map((m) => (
          <StageSlot
            key={m.mode}
            art={m.art}
            title={ENGLISH_MODE_LABELS[m.mode].toUpperCase()}
            text={
              m.mode === 'review'
                ? `${missCount} pendientes · prioriza tus fallos`
                : m.text
            }
            className={m.className}
            tag={m.tag}
            featured
            onClick={() => navigate(`${base}/${m.mode}`)}
          />
        ))}
        roster={roster.map((m) => (
          <StageSlot
            key={m.mode}
            art={m.art}
            title={ENGLISH_MODE_LABELS[m.mode].toUpperCase()}
            text={m.text}
            className={m.className}
            tag={m.tag}
            onClick={() => navigate(`${base}/${m.mode}`)}
          />
        ))}
        rosterCols={3}
      />
    </AppShell>
  )
}

export function EnglishModeSelectScreen() {
  const { packId } = useParams<{ packId: string }>()
  const valid = packId != null && isEnglishHubPackId(packId)

  if (!valid || !packId) {
    return <Navigate to="/missions/english" replace />
  }

  return <EnglishModeSelectView packId={packId} />
}
