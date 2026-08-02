import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

export function EnglishModeSelectScreen() {
  const { packId } = useParams<{ packId: string }>()
  const navigate = useNavigate()
  const { playerId } = useProgress()
  const valid = packId != null && isEnglishHubPackId(packId)

  useEffect(() => {
    if (!valid) navigate('/missions/english', { replace: true })
  }, [valid, navigate])

  if (!valid || !packId) return null

  const missCount = countActiveEnglishMisses(playerId ?? 'local', packId)
  const base = `/missions/english/${packId}`
  const title = ENGLISH_PACK_LABELS[packId]
  const showIntruder = canBuildEnglishIntruder(packId)
  const heroes = HEROES.filter((m) => m.mode !== 'review' || missCount > 0)
  const roster = ROSTER.filter((m) => m.mode !== 'intruder' || showIntruder)

  return (
    <AppShell title={title.toUpperCase()} shortTitle={title} showBack backTo="/missions/english">
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
            to={`${base}/${m.mode}`}
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
            to={`${base}/${m.mode}`}
          />
        ))}
        rosterCols={2}
      />
    </AppShell>
  )
}
