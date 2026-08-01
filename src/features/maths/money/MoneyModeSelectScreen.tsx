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
}

const HEROES: MoneyPoster[] = [
  {
    mode: 'mix',
    art: 'money-mix',
    className: 'mode-poster--random',
    text: 'Mezcla de dinero',
    tag: 'DESTACADO',
  },
  {
    mode: 'change',
    art: 'money-change',
    className: 'mode-poster--challenge',
    text: 'Pagas y te devuelven',
    tag: 'RÁPIDO',
  },
]

const ROSTER: MoneyPoster[] = [
  { mode: 'shortfall', art: 'money-change', className: 'mode-poster--challenge', text: 'Precio vs lo que tienes', tag: '01' },
  { mode: 'build', art: 'money-build', className: 'mode-poster--train', text: 'Toca monedas (céntimos)', tag: '02' },
  { mode: 'sum', art: 'money-sum', className: 'mode-poster--learn', text: 'Suma billetes y monedas', tag: '03' },
  { mode: 'spare', art: 'money-spare', className: 'mode-poster--misses', text: '¿Qué moneda sobra?', tag: '04' },
]

export function MoneyModeSelectScreen() {
  const { playerId } = useProgress()
  const missCount = countActiveMathsMisses(playerId ?? 'local', 'money')

  const roster: MoneyPoster[] = [
    ...(missCount > 0
      ? [
          {
            mode: 'misses' as const,
            art: 'mis-fallos' as ModeArtId,
            className: 'mode-poster--misses',
            text: `${missCount} pendiente${missCount === 1 ? '' : 's'}`,
            tag: 'REPASO',
          },
        ]
      : []),
    ...ROSTER,
  ]

  return (
    <AppShell title="DINERO" shortTitle="Dinero" showBack backTo="/missions/mates">
      <StageSelect
        note="Compras de 3.º · cambio, céntimos y ¿cuánto falta?"
        heroes={HEROES.map((m) => (
          <StageSlot
            key={m.mode}
            art={m.art}
            title={MONEY_MODE_LABELS[m.mode].toUpperCase()}
            text={m.text}
            className={m.className}
            tag={m.tag}
            featured
            to={`/missions/mates/money/${m.mode}`}
          />
        ))}
        roster={roster.map((m) => (
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
        rosterCols={2}
      />
    </AppShell>
  )
}
