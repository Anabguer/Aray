import type { ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import { useClockSession } from '@/clock/ClockSessionContext'
import type { ClockLang } from '@/clock/types'

const HEROES: Array<{
  to: string
  art: ModeArtId
  title: string
  text: string
  className: string
  tag: string
}> = [
  {
    to: '/missions/mates/clocks/learn',
    art: 'clock-learn',
    title: 'APRENDE',
    text: 'Elige castellano o catalán y Lumo te explica',
    className: 'mode-poster--learn',
    tag: 'DESTACADO',
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

export function ClockModeSelectScreen() {
  const { lang, setLang } = useClockSession()

  function pickLang(next: ClockLang) {
    setLang(next)
  }

  return (
    <AppShell title="HORAS" shortTitle="Horas" showBack backTo="/missions/mates">
      <StageSelect
        beforeBoard={
          <p className="clock-modes__lang">
            Para Entrena y Empareja:{' '}
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
        roster={
          <StageSlot
            art="clock-match"
            title="EMPAREJA"
            text="Relaciona relojes y horas"
            className="mode-poster--match"
            tag="01"
            to="/missions/mates/clocks/match"
          />
        }
        rosterCols={1}
      />
    </AppShell>
  )
}
