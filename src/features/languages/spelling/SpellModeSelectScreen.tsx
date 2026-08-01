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

const HEROES: SpellPoster[] = [
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
    text: 'Todas las reglas en una partida',
    tag: 'DESTACADO',
  },
]

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
    text: 'Pronto: imagen real de cada palabra',
    tag: '05',
  },
]

export function SpellModeSelectScreen() {
  const { playerId } = useProgress()
  const missCount = countActiveSpellMisses(playerId ?? 'local')

  return (
    <AppShell title="ORTOGRAFÍA" shortTitle="Ortografía" showBack backTo="/missions/languages">
      <StageSelect
        heroes={HEROES.map((m) => (
          <StageSlot
            key={m.mode}
            art={m.art}
            title={SPELL_MODE_LABELS[m.mode].toUpperCase()}
            text={
              m.mode === 'review'
                ? missCount > 0
                  ? `${missCount} pendientes · prioriza tus fallos`
                  : 'Aún no hay fallos guardados · juega y se irán guardando'
                : m.text
            }
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
            locked={m.mode === 'picture'}
            to={m.mode === 'picture' ? undefined : `/missions/languages/spelling/${m.mode}`}
          />
        ))}
        rosterCols={3}
      />
    </AppShell>
  )
}
