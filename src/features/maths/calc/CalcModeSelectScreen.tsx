import type { ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import { CALC_MODE_LABELS, CALC_ROUND_SIZE, type CalcPlayMode } from '@/calc'
import { countActiveMathsMisses } from '@/math/missStore'
import { useProgress } from '@/progress/ProgressContext'
import './calc.css'

type CalcPoster = {
  mode: CalcPlayMode | 'misses'
  art: ModeArtId
  className: string
  text: string
  tag: string
  locked?: boolean
}

/** Retos concretos: Random (mix) los mezcla en una ronda de 12. */
const ROSTER: CalcPoster[] = [
  { mode: 'add', art: 'calc-add', className: 'mode-poster--train', text: 'Suma y elige', tag: '01' },
  { mode: 'sub', art: 'calc-sub', className: 'mode-poster--misses', text: 'Resta y elige', tag: '02' },
  { mode: 'missing', art: 'calc-missing', className: 'mode-poster--learn', text: '8 + ? = 15', tag: '03' },
  { mode: 'doubles', art: 'calc-doubles', className: 'mode-poster--match', text: '9 + 9', tag: '04' },
  { mode: 'halves', art: 'calc-halves', className: 'mode-poster--random', text: 'Mitad de 18', tag: '05' },
  { mode: 'near10', art: 'calc-near10', className: 'mode-poster--train', text: 'Hasta 10 o 100', tag: '06' },
  { mode: 'compare', art: 'calc-compare', className: 'mode-poster--learn', text: '3–4 cifras', tag: '07' },
  { mode: 'order', art: 'calc-order', className: 'mode-poster--match', text: 'Hasta 9999', tag: '08' },
  {
    mode: 'truefalse',
    art: 'calc-truefalse',
    className: 'mode-poster--challenge',
    text: '¿Correcto o no?',
    tag: '09',
  },
]

/** Arriba: Random + Mis fallos. Abajo: cuadrícula de retos. */
export function CalcModeSelectScreen() {
  const { playerId } = useProgress()
  const missCount = countActiveMathsMisses(playerId ?? 'local', 'calc')

  const heroes: CalcPoster[] = [
    {
      mode: 'mix',
      art: 'calc-mix',
      className: 'mode-poster--random',
      text: `${CALC_ROUND_SIZE} preguntas · suma, resta y más mezclados`,
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
    <AppShell title="CÁLCULO" shortTitle="Cálculo" showBack backTo="/missions/mates">
      <StageSelect
        note={`${CALC_ROUND_SIZE} preguntas · sin reloj · solo botones`}
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
        roster={ROSTER.map((m) => (
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
        rosterCols={3}
      />
    </AppShell>
  )
}
