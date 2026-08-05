import type { ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import { MONEY_MODE_LABELS, type MoneyPlayMode } from '@/money'
import { countActiveMathsMisses } from '@/math/missStore'
import { useProgress } from '@/progress/ProgressContext'
import './money.css'

type MoneyPoster = {
  mode: MoneyPlayMode | 'misses'
  art: ModeArtId
  className: string
  text: string
  tag: string
  locked?: boolean
}

const ROSTER: MoneyPoster[] = [
  {
    mode: 'change',
    art: 'money-change',
    className: 'mode-poster--challenge',
    text: 'Pagas y te devuelven',
    tag: '01',
  },
  {
    mode: 'shortfall',
    art: 'money-change',
    className: 'mode-poster--challenge',
    text: 'Precio vs lo que tienes',
    tag: '02',
  },
  {
    mode: 'build',
    art: 'money-build',
    className: 'mode-poster--train',
    text: 'Toca monedas (céntimos)',
    tag: '03',
  },
  {
    mode: 'sum',
    art: 'money-sum',
    className: 'mode-poster--learn',
    text: 'Suma billetes y monedas',
    tag: '04',
  },
  {
    mode: 'spare',
    art: 'money-spare',
    className: 'mode-poster--misses',
    text: '¿Qué moneda sobra?',
    tag: '05',
  },
]

/** Arriba: Random + Mis fallos. Abajo: retos de dinero. */
export function MoneyModeSelectScreen() {
  const { playerId } = useProgress()
  const missCount = countActiveMathsMisses(playerId ?? 'local', 'money')

  const heroes: MoneyPoster[] = [
    {
      mode: 'mix',
      art: 'money-mix',
      className: 'mode-poster--random',
      text: 'Cambio, precios y monedas mezclados',
      tag: 'DESTACADO',
    },
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
        roster={ROSTER.map((m) => (
          <StageSlot
            key={m.mode}
            art={m.art}
            title={MONEY_MODE_LABELS[m.mode].toUpperCase()}
            text={m.text}
            className={m.className}
            tag={m.tag}
            to={`/missions/mates/money/${m.mode}`}
          />
        ))}
        rosterCols={3}
      />
    </AppShell>
  )
}
