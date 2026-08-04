import type { ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import { CALC_DURATION_SEC, CALC_MODE_LABELS } from '@/calc'
import { countActiveMathsMisses } from '@/math/missStore'
import { useProgress } from '@/progress/ProgressContext'
import './calc.css'

/** Solo Mis fallos + Random (el resto de modos va dentro de mix). */
export function CalcModeSelectScreen() {
  const { playerId } = useProgress()
  const missCount = countActiveMathsMisses(playerId ?? 'local', 'calc')

  const heroes: Array<{
    mode: 'misses' | 'mix'
    art: ModeArtId
    className: string
    text: string
    tag: string
    locked?: boolean
  }> = [
    {
      mode: 'misses',
      art: 'mis-fallos',
      className: 'mode-poster--misses',
      text:
        missCount > 0
          ? `${missCount} pendiente${missCount === 1 ? '' : 's'} · prioriza tus fallos`
          : 'Aún no hay fallos · juega Random y se irán guardando',
      tag: 'REPASO',
      locked: missCount === 0,
    },
    {
      mode: 'mix',
      art: 'calc-mix',
      className: 'mode-poster--random',
      text: `${CALC_DURATION_SEC}s · suma, resta y más mezclados`,
      tag: 'DESTACADO',
    },
  ]

  return (
    <AppShell title="CÁLCULO" shortTitle="Cálculo" showBack backTo="/missions/mates">
      <StageSelect
        note={`Piensa rápido · ${CALC_DURATION_SEC} segundos · solo botones`}
        heroes={heroes.map((m) => (
          <StageSlot
            key={m.mode}
            art={m.art}
            title={
              m.mode === 'mix' ? 'RANDOM' : CALC_MODE_LABELS[m.mode].toUpperCase()
            }
            text={m.text}
            className={m.className}
            tag={m.tag}
            featured
            locked={m.locked}
            to={m.locked ? undefined : `/missions/mates/calc/${m.mode}`}
          />
        ))}
      />
    </AppShell>
  )
}
