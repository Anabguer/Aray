import type { ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import { useClockSession } from '@/clock/ClockSessionContext'
import type { ClockLang } from '@/clock/types'
import { countActiveMathsMisses } from '@/math/missStore'
import { useProgress } from '@/progress/ProgressContext'

type ClockPoster = {
  to: string
  art: ModeArtId
  title: string
  text: string
  className: string
  tag: string
}

const HEROES: ClockPoster[] = [
  {
    to: '/missions/mates/clocks/learn',
    art: 'clock-learn',
    title: 'APRENDE',
    text: 'Castellano o catalán, paso a paso',
    className: 'mode-poster--learn',
    tag: 'GUÍA',
  },
  {
    to: '/missions/mates/clocks/train',
    art: 'clock-train',
    title: 'ENTRENA',
    text: 'Mira el reloj y elige la frase',
    className: 'mode-poster--train',
    tag: 'RÁPIDO',
  },
]

const ROSTER_BASE: ClockPoster[] = [
  {
    to: '/missions/mates/clocks/match',
    art: 'clock-match',
    title: 'EMPAREJA',
    text: 'Relaciona relojes y horas',
    className: 'mode-poster--match',
    tag: '01',
  },
]

export function ClockModeSelectScreen() {
  const { lang, setLang } = useClockSession()
  const { playerId } = useProgress()
  const missCount = countActiveMathsMisses(playerId ?? 'local', 'clocks')

  function pickLang(next: ClockLang) {
    setLang(next)
  }

  const roster: ClockPoster[] = [
    ...(missCount > 0
      ? [
          {
            to: '/missions/mates/clocks/misses',
            art: 'mis-fallos' as ModeArtId,
            title: 'MIS FALLOS',
            text: `${missCount} pendiente${missCount === 1 ? '' : 's'}`,
            className: 'mode-poster--misses',
            tag: 'REPASO',
          },
        ]
      : []),
    ...ROSTER_BASE,
  ]

  return (
    <AppShell title="HORAS" shortTitle="Horas" showBack backTo="/missions/mates">
      <StageSelect
        note="Lee el reloj · castellano o catalán"
        beforeBoard={
          <p className="clock-modes__lang">
            Idioma para Entrena y Empareja:{' '}
            <button
              type="button"
              className={`clock-modes__lang-btn${lang === 'es' ? ' is-on' : ''}`}
              onClick={() => pickLang('es')}
            >
              Castellano
            </button>
            <button
              type="button"
              className={`clock-modes__lang-btn${lang === 'ca' ? ' is-on' : ''}`}
              onClick={() => pickLang('ca')}
            >
              Català
            </button>
          </p>
        }
        heroes={HEROES.map((m) => (
          <StageSlot
            key={m.to}
            art={m.art}
            title={m.title}
            text={m.text}
            className={m.className}
            tag={m.tag}
            featured
            to={m.to}
          />
        ))}
        roster={roster.map((m) => (
          <StageSlot
            key={m.to}
            art={m.art}
            title={m.title}
            text={m.text}
            className={m.className}
            tag={m.tag}
            to={m.to}
          />
        ))}
        rosterCols={1}
        divider="Más modos"
      />
    </AppShell>
  )
}
