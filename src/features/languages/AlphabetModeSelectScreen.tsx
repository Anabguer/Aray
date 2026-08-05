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

const ROSTER: Array<{
  id: AlphabetPlayMode
  art: ModeArtId
  title: string
  text: string
  className: string
  tag: string
}> = [
  {
    id: 'missing',
    art: 'abc-falta',
    title: 'LETRA QUE FALTA',
    text: 'Completa la cadena',
    className: 'mode-poster--learn',
    tag: '01',
  },
  {
    id: 'neighbor',
    art: 'abc-vecina',
    title: 'SIGUIENTE / ANTERIOR',
    text: 'Lumo saca una letra',
    className: 'mode-poster--train',
    tag: '02',
  },
  {
    id: 'order-letters',
    art: 'abc-letras',
    title: 'ORDENA LETRAS',
    text: 'De la A a la Z',
    className: 'mode-poster--match',
    tag: '03',
  },
  {
    id: 'order-words',
    art: 'abc-palabras',
    title: 'ORDENA PALABRAS',
    text: 'Como en el diccionario',
    className: 'mode-poster--challenge',
    tag: '04',
  },
]

/** Arriba: Random + Mis fallos. Abajo: modos de ordenación. */
export function AlphabetModeSelectScreen() {
  const navigate = useNavigate()
  const { progress } = useProgress()

  const needsReview = REVIEWABLE.filter((id) => {
    const st = alphabetModeStatus(
      normalizeAlphabetModeProgress(progress.alphabet.modes[id]),
    )
    return st.recommendPractice
  })

  function badgeFor(id: AlphabetPlayMode): string | null {
    const st = alphabetModeStatus(
      normalizeAlphabetModeProgress(progress.alphabet.modes[id]),
    )
    if (st.kind === 'needs_train' || st.kind === 'mastered_review') return 'Repasar'
    if (st.kind === 'mastered') return 'Domado'
    return null
  }

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
      id: 'random',
      art: 'abc-random',
      title: 'RANDOM',
      text: 'Mezcla de ordenación',
      className: 'mode-poster--random',
      tag: 'DESTACADO',
      to: '/missions/languages/alphabet/random',
    },
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
  ]

  const reviewHint = ROSTER.some((m) => {
    const st = alphabetModeStatus(
      normalizeAlphabetModeProgress(progress.alphabet.modes[m.id]),
    )
    return st.recommendPractice
  })

  return (
    <AppShell title="ORDENAR" shortTitle="Orden" showBack backTo="/missions/languages">
      <StageSelect
        note={
          <>
            <span>Ordena como en el diccionario (3.º). No es aprender el abecedario.</span>
            {reviewHint ? (
              <p
                className="alphabet-modes__review"
                role="status"
                style={{ marginTop: '0.45rem' }}
              >
                Hay modos que conviene repasar (marcados abajo).
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
            to={m.to}
            onClick={m.onClick}
          />
        ))}
        roster={ROSTER.map((m) => (
          <StageSlot
            key={m.id}
            art={m.art}
            title={m.title}
            text={m.text}
            className={m.className}
            tag={m.tag}
            badge={badgeFor(m.id)}
            to={`/missions/languages/alphabet/${m.id}`}
          />
        ))}
      />
    </AppShell>
  )
}
