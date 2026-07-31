import { Link } from 'react-router-dom'
import { modeArtUrl, type ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { IconPlay } from '@/components/Icons'

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

export function AlphabetModeSelectScreen() {
  return (
    <AppShell
      title="ABC"
      shortTitle="Abc"
      showBack
      backTo="/missions/languages"
    >
      <section className="alphabet-modes mode-select--lobby" aria-label="Modos del ABC">
        <p className="alphabet-modes__lead">
          Repasa las letras sin prisa. Elige un juego o deja que Lumo mezcle.
        </p>
        <div className="mode-posters mode-posters--alphabet" role="list">
          <ModePoster
            art="abc-falta"
            title="LETRA QUE FALTA"
            text="Completa la cadena"
            className="mode-poster--learn"
            to="/missions/languages/alphabet/missing"
          />
          <ModePoster
            art="abc-vecina"
            title="SIGUIENTE / ANTERIOR"
            text="Lumo saca una letra"
            className="mode-poster--train"
            to="/missions/languages/alphabet/neighbor"
          />
          <ModePoster
            art="abc-letras"
            title="ORDENA LETRAS"
            text="De la A a la Z"
            className="mode-poster--match"
            to="/missions/languages/alphabet/order-letters"
          />
          <ModePoster
            art="abc-palabras"
            title="ORDENA PALABRAS"
            text="A→Z o Z→A"
            className="mode-poster--challenge"
            to="/missions/languages/alphabet/order-words"
          />
          <ModePoster
            art="abc-random"
            title="RANDOM"
            text="Cada ronda un juego distinto"
            className="mode-poster--random"
            to="/missions/languages/alphabet/random"
          />
        </div>
      </section>
    </AppShell>
  )
}
