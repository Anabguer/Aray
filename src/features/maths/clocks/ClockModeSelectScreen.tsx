import { Link } from 'react-router-dom'
import { modeArtUrl, type ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { IconPlay } from '@/components/Icons'
import { useClockSession } from '@/clock/ClockSessionContext'

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
  const { lang } = useClockSession()
  const langLabel = lang === 'ca' ? 'Català' : 'Castellano'

  return (
    <AppShell title="MODO" shortTitle="Modo" showBack backTo="/missions/mates/clocks">
      <p className="clock-modes__lang">
        Idioma: <strong>{langLabel}</strong>
        {' · '}
        <Link to="/missions/mates/clocks">Cambiar</Link>
      </p>
      <div className="mode-posters mode-posters--clocks" role="list">
        <ModePoster
          art="aprende"
          title="APRENDE"
          text={
            lang === 'ca'
              ? 'Lumo te enseña los quarts'
              : 'Lumo te enseña a decir la hora'
          }
          className="mode-poster--learn"
          to="/missions/mates/clocks/learn"
        />
        <ModePoster
          art="entrena"
          title="ENTRENA"
          text="Mira el reloj y elige la frase"
          className="mode-poster--train"
          to="/missions/mates/clocks/train"
        />
        <ModePoster
          art="empareja"
          title="EMPAREJA"
          text="Relaciona relojes y horas"
          className="mode-poster--match"
          to="/missions/mates/clocks/match"
        />
      </div>
    </AppShell>
  )
}
