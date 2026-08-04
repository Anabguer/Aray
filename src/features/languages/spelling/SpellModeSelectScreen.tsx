import type { ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import { useProgress } from '@/progress/ProgressContext'
import {
  SPELL_MODE_LABELS,
  countActiveSpellMisses,
} from '@/spelling'
import './spelling.css'

/** Solo Mis fallos + Random. */
export function SpellModeSelectScreen() {
  const { playerId } = useProgress()
  const missCount = countActiveSpellMisses(playerId ?? 'local')

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
          : 'Aún no hay fallos guardados · juega y se irán guardando',
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
      />
    </AppShell>
  )
}
