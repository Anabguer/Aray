import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { modeArtUrl, type ModeArtId } from '@/assets/modes'
import { IconPlay } from '@/components/Icons'
import './stage-select.css'

export function StageSelect({
  kicker = 'Selecciona misión',
  title = 'Elige tu misión',
  note,
  heroes,
  roster,
  divider = 'Retos',
  heroesCols = 2,
  rosterCols,
  beforeBoard,
  ariaLabel = 'Selección de misión',
}: {
  kicker?: string
  title?: string
  note?: ReactNode
  heroes: ReactNode
  roster?: ReactNode
  divider?: string
  heroesCols?: 2 | 3
  rosterCols?: 1 | 2 | 3 | 4
  beforeBoard?: ReactNode
  ariaLabel?: string
}) {
  const heroesClass =
    heroesCols === 3 ? 'stage-select__heroes stage-select__heroes--3' : 'stage-select__heroes'

  const rosterClass =
    rosterCols === 1
      ? 'stage-select__roster stage-select__roster--1'
      : rosterCols === 2
        ? 'stage-select__roster stage-select__roster--2'
        : rosterCols === 3
          ? 'stage-select__roster stage-select__roster--3'
          : 'stage-select__roster'

  return (
    <section className="stage-select" aria-label={ariaLabel}>
      <header className="stage-select__head">
        <p className="stage-select__kicker">{kicker}</p>
        <h2 className="stage-select__title">{title}</h2>
        {note ? <div className="stage-select__note">{note}</div> : null}
      </header>

      {beforeBoard}

      <div className="stage-select__board">
        <div className={heroesClass} role="list">
          {heroes}
        </div>

        {roster ? (
          <>
            <p className="stage-select__divider" aria-hidden="true">
              <span>{divider}</span>
            </p>
            <div className={rosterClass} role="list">
              {roster}
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}

export function StageSlot({
  art,
  imageSrc,
  title,
  text,
  className,
  tag,
  to,
  onClick,
  featured = false,
  locked = false,
  world = false,
  badge,
  ctaLabel = 'JUGAR',
}: {
  art?: ModeArtId
  imageSrc?: string
  title: string
  text: string
  className: string
  tag: string
  to?: string
  onClick?: () => void
  featured?: boolean
  locked?: boolean
  world?: boolean
  badge?: string | null
  ctaLabel?: string
}) {
  const src = imageSrc ?? (art ? modeArtUrl(art) : '')
  const classes = [
    'mode-poster',
    'stage-slot',
    featured ? 'stage-slot--hero' : 'stage-slot--chip',
    world ? 'stage-slot--world' : '',
    locked ? 'stage-slot--locked' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const body = (
    <>
      <span className="stage-slot__tag" aria-hidden="true">
        {tag}
      </span>
      <span className="mode-poster__media stage-slot__media" aria-hidden="true">
        <img
          src={src}
          alt=""
          className="mode-poster__img"
          width={512}
          height={512}
          draggable={false}
          decoding="async"
        />
        <span className="mode-poster__fade" />
      </span>
      <span className="mode-poster__body stage-slot__body">
        <span className="mode-poster__title">{title}</span>
        <span className="mode-poster__text">{text}</span>
        {badge ? <span className="stage-slot__badge">{badge}</span> : null}
        <span className="stage-slot__cta" aria-hidden="true">
          {!locked ? <IconPlay className="stage-slot__cta-icon" /> : null}
          <span>{locked ? 'PRÓXIMAMENTE' : ctaLabel}</span>
        </span>
      </span>
    </>
  )

  const label = `${title}. ${text}`

  if (locked || (!to && !onClick)) {
    return (
      <div className={classes} aria-label={label} role="listitem">
        {body}
      </div>
    )
  }

  if (to) {
    return (
      <Link to={to} className={classes} aria-label={label} role="listitem">
        {body}
      </Link>
    )
  }

  return (
    <button type="button" className={classes} onClick={onClick} aria-label={label}>
      {body}
    </button>
  )
}
