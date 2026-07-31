import { Link } from 'react-router-dom'
import { modeArtUrl, type ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { IconPlay } from '@/components/Icons'
import { useClockSession } from '@/clock/ClockSessionContext'
import type { ClockLang } from '@/clock/types'

function ModePoster({
  art,
  title,
  text,
  className,
  to,
}: {
  art: ModeArtId
  title: string
  text: string
  className: string
  to: string
}) {
  return (
    <Link to={to} className={`mode-poster ${className}`} aria-label={`${title}. ${text}`}>
      <span className="mode-poster__media" aria-hidden="true">
        <img
          src={modeArtUrl(art)}
          alt=""
          className="mode-poster__img"
          width={512}
          height={512}
          draggable={false}
          decoding="async"
        />
        <span className="mode-poster__fade" />
      </span>
      <span className="mode-poster__body">
        <span className="mode-poster__title">{title}</span>
        <span className="mode-poster__text">{text}</span>
        <span className="mode-poster__go" aria-hidden="true">
          <IconPlay className="mode-poster__go-icon" />
        </span>
      </span>
    </Link>
  )
}

export function ClockModeSelectScreen() {
  const { lang, setLang } = useClockSession()

  function pickLang(next: ClockLang) {
    setLang(next)
  }

  return (
    <AppShell title="HORAS" shortTitle="Horas" showBack backTo="/missions/mates">
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
      <div className="mode-posters mode-posters--clocks" role="list">
        <ModePoster
          art="clock-learn"
          title="APRENDE"
          text="Elige castellano o catalán y Lumo te explica"
          className="mode-poster--learn"
          to="/missions/mates/clocks/learn"
        />
        <ModePoster
          art="clock-train"
          title="ENTRENA"
          text="Mira el reloj y elige la frase"
          className="mode-poster--train"
          to="/missions/mates/clocks/train"
        />
        <ModePoster
          art="clock-match"
          title="EMPAREJA"
          text="Relaciona relojes y horas"
          className="mode-poster--match"
          to="/missions/mates/clocks/match"
        />
      </div>
    </AppShell>
  )
}
