import { useNavigate } from 'react-router-dom'
import {
  alphabetModeStatus,
  normalizeAlphabetModeProgress,
  type AlphabetPlayMode,
} from '@/alphabet'
import type { ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import { useProgress } from '@/progress/ProgressContext'

const REVIEWABLE: AlphabetPlayMode[] = [
  'missing',
  'neighbor',
  'order-letters',
  'order-words',
]

/** Solo Mis fallos (modos a repasar) + Random. */
export function AlphabetModeSelectScreen() {
  const navigate = useNavigate()
  const { progress } = useProgress()

  const needsReview = REVIEWABLE.filter((id) => {
    const st = alphabetModeStatus(
      normalizeAlphabetModeProgress(progress.alphabet.modes[id]),
    )
    return st.recommendPractice
  })

  function startMisses() {
    if (needsReview.length === 0) return
    const id = needsReview[Math.floor(Math.random() * needsReview.length)]!
    navigate(`/missions/languages/alphabet/${id}`)
  }

  const heroes: Array<{
    id: string
    art: ModeArtId
    title: string
    text: string
    className: string
    tag: string
    locked?: boolean
    to?: string
    onClick?: () => void
  }> = [
    {
      id: 'misses',
      art: 'mis-fallos',
      title: 'MIS FALLOS',
      text:
        needsReview.length > 0
          ? `${needsReview.length} modo${needsReview.length === 1 ? '' : 's'} para repasar`
          : 'Aún no hay modos para repasar · juega Random',
      className: 'mode-poster--misses',
      tag: 'REPASO',
      locked: needsReview.length === 0,
      onClick: needsReview.length > 0 ? startMisses : undefined,
    },
    {
      id: 'random',
      art: 'abc-random',
      title: 'RANDOM',
      text: 'Mezcla de ordenación',
      className: 'mode-poster--random',
      tag: 'DESTACADO',
      to: '/missions/languages/alphabet/random',
    },
  ]

  return (
    <AppShell title="ORDENAR" shortTitle="Orden" showBack backTo="/missions/languages">
      <StageSelect
        note="Ordena como en el diccionario (3.º). No es aprender el abecedario."
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
            to={m.to}
            onClick={m.onClick}
          />
        ))}
      />
    </AppShell>
  )
}
