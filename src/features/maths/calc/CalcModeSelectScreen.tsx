import type { ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import { CALC_DURATION_SEC, CALC_MODE_LABELS, type CalcPlayMode } from '@/calc'
import { countActiveMathsMisses } from '@/math/missStore'
import { useProgress } from '@/progress/ProgressContext'
import './calc.css'

type CalcPoster = {
  mode: CalcPlayMode | 'misses'
  art: ModeArtId
  className: string
  text: string
  tag: string
}

const HEROES: CalcPoster[] = [
  {
    mode: 'mix',
    art: 'calc-mix',
    className: 'mode-poster--challenge',
    text: `${CALC_DURATION_SEC}s · todo mezclado`,
    tag: 'DESTACADO',
  },
  {
    mode: 'add',
    art: 'calc-add',
    className: 'mode-poster--train',
    text: 'Suma y elige',
    tag: 'RÁPIDO',
  },
]

const ROSTER: CalcPoster[] = [
  { mode: 'sub', art: 'calc-sub', className: 'mode-poster--misses', text: 'Resta y elige', tag: '01' },
  { mode: 'missing', art: 'calc-missing', className: 'mode-poster--learn', text: '8 + ? = 15', tag: '02' },
  { mode: 'doubles', art: 'calc-doubles', className: 'mode-poster--match', text: '9 + 9', tag: '03' },
  { mode: 'halves', art: 'calc-halves', className: 'mode-poster--random', text: 'Mitad de 18', tag: '04' },
  { mode: 'near10', art: 'calc-near10', className: 'mode-poster--train', text: 'Hasta 10 o 100', tag: '05' },
  { mode: 'compare', art: 'calc-compare', className: 'mode-poster--learn', text: '3–4 cifras', tag: '06' },
  { mode: 'order', art: 'calc-order', className: 'mode-poster--match', text: 'Hasta 9999', tag: '07' },
  {
    mode: 'truefalse',
    art: 'calc-truefalse',
    className: 'mode-poster--challenge',
    text: '¿Correcto o no?',
    tag: '08',
  },
]

export function CalcModeSelectScreen() {
  const { playerId } = useProgress()
  const missCount = countActiveMathsMisses(playerId ?? 'local', 'calc')

  const roster: CalcPoster[] = [
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
    <AppShell title="CÁLCULO" shortTitle="Cálculo" showBack backTo="/missions/mates">
      <StageSelect
        note={`Piensa rápido · ${CALC_DURATION_SEC} segundos · solo botones`}
        heroes={HEROES.map((m) => (
          <StageSlot
            key={m.mode}
            art={m.art}
            title={CALC_MODE_LABELS[m.mode].toUpperCase()}
            text={m.text}
            className={m.className}
            tag={m.tag}
            featured
            to={`/missions/mates/calc/${m.mode}`}
          />
        ))}
        roster={roster.map((m) => (
          <StageSlot
            key={m.mode}
            art={m.art}
            title={CALC_MODE_LABELS[m.mode].toUpperCase()}
            text={m.text}
            className={m.className}
            tag={m.tag}
            to={`/missions/mates/calc/${m.mode}`}
          />
        ))}
      />
    </AppShell>
  )
}
