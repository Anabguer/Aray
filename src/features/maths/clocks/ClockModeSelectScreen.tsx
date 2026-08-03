import type { ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import { useClockSession } from '@/clock/ClockSessionContext'
import type { ClockLang } from '@/clock/types'
import { countActiveMathsMisses } from '@/math/missStore'
import { useProgress } from '@/progress/ProgressContext'
import './clocks.css'

type ClockPoster = {
  to: string
  art: ModeArtId
  title: string
  text: string
  className: string
  tag: string
}

/** Como Ortografía: REPASO + RANDOM/DESTACADO arriba; el resto en retos. */
const HEROES: ClockPoster[] = [
  {
    to: '/missions/mates/clocks/misses',
    art: 'mis-fallos',
    title: 'MIS FALLOS',
    text: 'Practica las que sueles fallar',
    className: 'mode-poster--misses',
    tag: 'REPASO',
  },
  {
    to: '/missions/mates/clocks/train',
    art: 'sorpresa',
    title: 'RANDOM',
    text: 'Lee el reloj · todo mezclado',
    className: 'mode-poster--random',
    tag: 'DESTACADO',
  },
]

const ROSTER: ClockPoster[] = [
  {
    to: '/missions/mates/clocks/learn',
    art: 'clock-learn',
    title: 'APRENDE',
    text: 'Castellano o catalán, paso a paso',
    className: 'mode-poster--learn',
    tag: '01',
  },
  {
    to: '/missions/mates/clocks/train',
    art: 'clock-train',
    title: 'ENTRENA',
    text: 'Mira el reloj y elige la frase',
    className: 'mode-poster--train',
    tag: '02',
  },
  {
    to: '/missions/mates/clocks/match',
    art: 'clock-match',
    title: 'EMPAREJA',
    text: 'Relaciona relojes y horas',
    className: 'mode-poster--match',
    tag: '03',
  },
]

export function ClockModeSelectScreen() {
  const { lang, setLang } = useClockSession()
  const { playerId } = useProgress()
  const missCount = countActiveMathsMisses(playerId ?? 'local', 'clocks')

  function pickLang(next: ClockLang) {
    setLang(next)
  }

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
            key={`${m.tag}-${m.to}`}
            art={m.art}
            title={m.title}
            text={
              m.tag === 'REPASO'
                ? missCount > 0
                  ? `${missCount} pendiente${missCount === 1 ? '' : 's'} · prioriza tus fallos`
                  : 'Aún no hay fallos guardados · juega y se irán guardando'
                : m.text
            }
            className={m.className}
            tag={m.tag}
            featured
            to={m.to}
          />
        ))}
        roster={ROSTER.map((m) => (
          <StageSlot
            key={m.to + m.tag}
            art={m.art}
            title={m.title}
            text={m.text}
            className={m.className}
            tag={m.tag}
            to={m.to}
          />
        ))}
        rosterCols={3}
      />
    </AppShell>
  )
}
