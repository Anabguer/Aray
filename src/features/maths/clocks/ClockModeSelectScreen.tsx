import { useNavigate } from 'react-router-dom'
import type { ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import { useClockSession } from '@/clock/ClockSessionContext'
import type { ClockLang } from '@/clock/types'
import { countActiveMathsMisses } from '@/math/missStore'
import { useProgress } from '@/progress/ProgressContext'
import './clocks.css'

const RANDOM_PATHS = [
  '/missions/mates/clocks/train',
  '/missions/mates/clocks/learn',
  '/missions/mates/clocks/match',
] as const

type ClockPoster = {
  id: string
  art: ModeArtId
  title: string
  text: string
  className: string
  tag: string
  locked?: boolean
  to?: string
  onClick?: () => void
}

const ROSTER: ClockPoster[] = [
  {
    id: 'learn',
    art: 'clock-learn',
    title: 'APRENDE',
    text: 'Castellano o catalán, paso a paso',
    className: 'mode-poster--learn',
    tag: '01',
    to: '/missions/mates/clocks/learn',
  },
  {
    id: 'train',
    art: 'clock-train',
    title: 'ENTRENA',
    text: 'Mira el reloj y elige la frase',
    className: 'mode-poster--train',
    tag: '02',
    to: '/missions/mates/clocks/train',
  },
  {
    id: 'match',
    art: 'clock-match',
    title: 'EMPAREJA',
    text: 'Relaciona relojes y horas',
    className: 'mode-poster--match',
    tag: '03',
    to: '/missions/mates/clocks/match',
  },
]

/** Arriba: Random + Mis fallos. Abajo: Aprende / Entrena / Empareja. */
export function ClockModeSelectScreen() {
  const navigate = useNavigate()
  const { lang, setLang } = useClockSession()
  const { playerId } = useProgress()
  const missCount = countActiveMathsMisses(playerId ?? 'local', 'clocks')

  function pickLang(next: ClockLang) {
    setLang(next)
  }

  function startRandom() {
    const path = RANDOM_PATHS[Math.floor(Math.random() * RANDOM_PATHS.length)]!
    navigate(path)
  }

  const heroes: ClockPoster[] = [
    {
      id: 'random',
      art: 'sorpresa',
      title: 'RANDOM',
      text: 'Aprende, entrena o empareja · Lumo elige',
      className: 'mode-poster--random',
      tag: 'DESTACADO',
      onClick: startRandom,
    },
    {
      id: 'misses',
      art: 'mis-fallos',
      title: 'MIS FALLOS',
      text:
        missCount > 0
          ? `${missCount} pendiente${missCount === 1 ? '' : 's'} · prioriza tus fallos`
          : 'Aún no hay fallos guardados · juega y se irán guardando',
      className: 'mode-poster--misses',
      tag: 'REPASO',
      locked: missCount === 0,
      to: missCount > 0 ? '/missions/mates/clocks/misses' : undefined,
    },
  ]

  return (
    <AppShell title="HORAS" shortTitle="Horas" showBack backTo="/missions/mates">
      <StageSelect
        note="Lee el reloj · castellano o catalán"
        beforeBoard={
          <p className="clock-modes__lang">
            Idioma:{' '}
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
        heroes={heroes.map((m) => (
          <StageSlot
            key={m.id}
            art={m.art}
            title={m.title}
            text={m.text}
            className={m.className}
            tag={m.tag}
            featured
            locked={m.locked}
            to={m.to}
            onClick={m.onClick}
          />
        ))}
        roster={ROSTER.map((m) => (
          <StageSlot
            key={m.id}
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
