import {
  alphabetModeStatus,
  normalizeAlphabetModeProgress,
  type AlphabetPlayMode,
} from '@/alphabet'
import type { ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import { useProgress } from '@/progress/ProgressContext'

const HEROES: Array<{
  id: AlphabetPlayMode
  art: ModeArtId
  title: string
  text: string
  className: string
  tag: string
}> = [
  {
    id: 'random',
    art: 'abc-random',
    title: 'RANDOM',
    text: 'Mezcla de ordenación',
    className: 'mode-poster--random',
    tag: 'DESTACADO',
  },
  {
    id: 'missing',
    art: 'abc-falta',
    title: 'LETRA QUE FALTA',
    text: 'Completa la cadena',
    className: 'mode-poster--learn',
    tag: 'RÁPIDO',
  },
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
    id: 'neighbor',
    art: 'abc-vecina',
    title: 'SIGUIENTE / ANTERIOR',
    text: 'Lumo saca una letra',
    className: 'mode-poster--train',
    tag: '01',
  },
  {
    id: 'order-letters',
    art: 'abc-letras',
    title: 'ORDENA LETRAS',
    text: 'De la A a la Z',
    className: 'mode-poster--match',
    tag: '02',
  },
  {
    id: 'order-words',
    art: 'abc-palabras',
    title: 'ORDENA PALABRAS',
    text: 'Como en el diccionario',
    className: 'mode-poster--challenge',
    tag: '03',
  },
]

export function AlphabetModeSelectScreen() {
  const { progress } = useProgress()

  function badgeFor(id: AlphabetPlayMode): string | null {
    const st = alphabetModeStatus(normalizeAlphabetModeProgress(progress.alphabet.modes[id]))
    if (st.kind === 'needs_train' || st.kind === 'mastered_review') return 'Repasar'
    if (st.kind === 'mastered') return 'Domado'
    return null
  }

  const reviewHint = [...HEROES, ...ROSTER].some((m) => {
    const st = alphabetModeStatus(normalizeAlphabetModeProgress(progress.alphabet.modes[m.id]))
    return st.recommendPractice
  })

  return (
    <AppShell title="ORDENAR" shortTitle="Orden" showBack backTo="/missions/languages">
      <StageSelect
        note={
          <>
            <span>Ordena como en el diccionario (3.º). No es aprender el abecedario.</span>
            {reviewHint ? (
              <p className="alphabet-modes__review" role="status" style={{ marginTop: '0.45rem' }}>
                Hay modos que conviene repasar (marcados abajo).
              </p>
            ) : null}
          </>
        }
        heroes={HEROES.map((m) => (
          <StageSlot
            key={m.id}
            art={m.art}
            title={m.title}
            text={m.text}
            className={m.className}
            tag={m.tag}
            featured
            badge={badgeFor(m.id)}
            to={`/missions/languages/alphabet/${m.id}`}
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
        rosterCols={3}
      />
    </AppShell>
  )
}
