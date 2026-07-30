import { Link } from 'react-router-dom'

export type WorldSceneVariant = 'hero' | 'side' | 'wide'

function LockMark() {
  return (
    <svg
      className="world-scene__badge-lock"
      viewBox="0 0 24 24"
      width="0.95em"
      height="0.95em"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 10V8a4 4 0 0 1 8 0v2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <rect
        x="5.5"
        y="10"
        width="13"
        height="10"
        rx="2.4"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle cx="12" cy="14.2" r="1.05" fill="currentColor" />
    </svg>
  )
}

export function WorldScene({
  id,
  title,
  imageSrc,
  available,
  path,
  recommended = false,
  progressPct,
  variant,
}: {
  id: string
  title: string
  imageSrc: string
  available: boolean
  path?: string
  recommended?: boolean
  progressPct?: number
  variant: WorldSceneVariant
}) {
  const stateLabel = available ? 'disponible' : 'próximamente'
  const alt = `Mundo de ${title}, ${stateLabel}`
  const ariaLabel = available ? `Jugar ${title}` : `${title}: próximamente`

  const body = (
    <>
      <img className="world-scene__art" src={imageSrc} alt={alt} draggable={false} />
      <div className="world-scene__ui">
        {recommended ? <span className="world-scene__chip">Recomendado</span> : null}
        {typeof progressPct === 'number' && available ? (
          <span
            className="world-scene__progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPct}
            aria-label={`Progreso de ${title}: ${progressPct}%`}
          >
            <span style={{ width: `${Math.max(progressPct, 8)}%` }} />
          </span>
        ) : null}
        {available ? (
          <span className="world-scene__cta world-scene__cta--play">
            <span className="world-scene__cta-play" aria-hidden="true">
              ▶
            </span>
            JUGAR
          </span>
        ) : (
          <span className="world-scene__badge">
            <LockMark />
            PRÓXIMAMENTE
          </span>
        )}
      </div>
    </>
  )

  const className = `world-scene world-scene--${variant} world-scene--${id}${
    available ? ' world-scene--available' : ' world-scene--locked'
  }`

  if (available && path) {
    return (
      <Link to={path} className={className} aria-label={ariaLabel}>
        {body}
      </Link>
    )
  }

  return (
    <div className={className} aria-label={ariaLabel} role="group">
      {body}
    </div>
  )
}
