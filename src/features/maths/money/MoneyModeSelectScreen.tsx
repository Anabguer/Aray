import type { ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import { MONEY_MODE_LABELS } from '@/money'
import { countActiveMathsMisses } from '@/math/missStore'
import { useProgress } from '@/progress/ProgressContext'
import './money.css'

/** Solo Mis fallos + Random. */
export function MoneyModeSelectScreen() {
  const { playerId } = useProgress()
  const missCount = countActiveMathsMisses(playerId ?? 'local', 'money')

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
      art: 'money-mix',
      className: 'mode-poster--random',
      text: 'Cambio, precios y monedas mezclados',
      tag: 'DESTACADO',
    },
  ]

  return (
    <AppShell title="DINERO" shortTitle="Dinero" showBack backTo="/missions/mates">
      <StageSelect
        note="Compras de 3.º · cambio, céntimos y ¿cuánto falta?"
        heroes={heroes.map((m) => (
          <StageSlot
            key={m.mode}
            art={m.art}
            title={
              m.mode === 'mix' ? 'RANDOM' : MONEY_MODE_LABELS[m.mode].toUpperCase()
            }
            text={m.text}
            className={m.className}
            tag={m.tag}
            featured
            locked={m.locked}
            to={m.locked ? undefined : `/missions/mates/money/${m.mode}`}
          />
        ))}
      />
    </AppShell>
  )
}
