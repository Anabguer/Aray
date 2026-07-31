import type { ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import { MONEY_MODE_LABELS, type MoneyPlayMode } from '@/money'
import './money.css'

type MoneyPoster = {
  mode: MoneyPlayMode
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
  { mode: 'build', art: 'money-build', className: 'mode-poster--train', text: 'Toca monedas', tag: '01' },
  { mode: 'spare', art: 'money-spare', className: 'mode-poster--misses', text: '¿Qué moneda sobra?', tag: '02' },
  { mode: 'sum', art: 'money-sum', className: 'mode-poster--learn', text: 'Suma billetes y monedas', tag: '03' },
]

export function MoneyModeSelectScreen() {
  return (
    <AppShell title="DINERO" shortTitle="Dinero" showBack backTo="/missions/mates">
      <StageSelect
        note="Compras, cambio y monedas · solo botones"
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
