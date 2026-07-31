import type { ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import { SPELL_MODE_LABELS, type SpellPlayMode } from '@/spelling'
import './spelling.css'

type SpellPoster = {
  mode: SpellPlayMode
  art: ModeArtId
  className: string
  text: string
  tag: string
}

/** Dos protagonistas arriba + cuatro retos abajo (grid 4 cols alineada). */
const HEROES: SpellPoster[] = [
  {
    mode: 'mix',
    art: 'spell-mix',
    className: 'mode-poster--random',
    text: 'Todas las reglas en una partida',
    tag: 'DESTACADO',
  },
  {
    mode: 'intruder',
    art: 'spell-intruder',
    className: 'mode-poster--misses',
    text: 'Caza la palabra mal escrita',
    tag: 'RÁPIDO',
  },
]

const ROSTER: SpellPoster[] = [
  {
    mode: 'complete',
    art: 'spell-complete',
    className: 'mode-poster--challenge',
    text: 'hay / ahí / ¡ay!',
    tag: '01',
  },
  {
    mode: 'correct',
    art: 'spell-correct',
    className: 'mode-poster--train',
    text: 'hecho o echo',
    tag: '02',
  },
  {
    mode: 'missing',
    art: 'spell-missing',
    className: 'mode-poster--learn',
    text: 'Letra de la regla',
    tag: '03',
  },
  {
    mode: 'picture',
    art: 'spell-picture',
    className: 'mode-poster--match',
    text: 'Imagen → escritura',
    tag: '04',
  },
]

export function SpellModeSelectScreen() {
  return (
    <AppShell title="ORTOGRAFÍA" shortTitle="Ortografía" showBack backTo="/missions/languages">
      <StageSelect
        heroes={HEROES.map((m) => (
          <StageSlot
            key={m.mode}
            art={m.art}
            title={SPELL_MODE_LABELS[m.mode].toUpperCase()}
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
      />
    </AppShell>
  )
}
