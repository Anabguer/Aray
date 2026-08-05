import type { ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import { useProgress } from '@/progress/ProgressContext'
import {
  SPELL_MODE_LABELS,
  countActiveSpellMisses,
  type SpellPlayMode,
} from '@/spelling'
import './spelling.css'

type SpellPoster = {
  mode: SpellPlayMode
  art: ModeArtId
  className: string
  text: string
  tag: string
}

const ROSTER: SpellPoster[] = [
  {
    mode: 'intruder',
    art: 'spell-intruder',
    className: 'mode-poster--challenge',
    text: 'Caza la palabra mal escrita',
    tag: '01',
  },
  {
    mode: 'complete',
    art: 'spell-complete',
    className: 'mode-poster--challenge',
    text: 'hay / ahí / ¡ay!',
    tag: '02',
  },
  {
    mode: 'correct',
    art: 'spell-correct',
    className: 'mode-poster--train',
    text: 'Forma correcta',
    tag: '03',
  },
  {
    mode: 'missing',
    art: 'spell-missing',
    className: 'mode-poster--learn',
    text: 'Letra de la regla',
    tag: '04',
  },
  {
    mode: 'picture',
    art: 'spell-picture',
    className: 'mode-poster--match',
    text: 'Elige la palabra de la imagen',
    tag: '05',
  },
]

/** Arriba: Random + Mis fallos. Abajo: retos de ortografía. */
export function SpellModeSelectScreen() {
  const { playerId } = useProgress()
  const missCount = countActiveSpellMisses(playerId ?? 'local')

  const heroes: SpellPoster[] = [
    {
      mode: 'mix',
      art: 'spell-mix',
      className: 'mode-poster--random',
      text: 'Todas las reglas en una partida',
      tag: 'DESTACADO',
    },
    {
      mode: 'review',
      art: 'mis-fallos',
      className: 'mode-poster--misses',
      text:
        missCount > 0
          ? `${missCount} pendientes · prioriza tus fallos`
          : 'Aún no hay fallos guardados · juega y se irán guardando',
      tag: 'REPASO',
    },
  ]

  return (
    <AppShell title="ORTOGRAFÍA" shortTitle="Ortografía" showBack backTo="/missions/languages">
      <StageSelect
        heroes={heroes.map((m) => (
          <StageSlot
            key={m.mode}
            art={m.art}
            title={
              m.mode === 'mix'
                ? 'RANDOM'
                : SPELL_MODE_LABELS[m.mode].toUpperCase()
            }
            text={m.text}
            className={m.className}
            tag={m.tag}
            featured
            to={`/missions/languages/spelling/${m.mode}`}
          />
        ))}
        roster={ROSTER.map((m) => (
          <StageSlot
            key={m.mode}
            art={m.art}
            title={SPELL_MODE_LABELS[m.mode].toUpperCase()}
            text={m.text}
            className={m.className}
            tag={m.tag}
            to={`/missions/languages/spelling/${m.mode}`}
          />
        ))}
        rosterCols={3}
      />
    </AppShell>
  )
}
