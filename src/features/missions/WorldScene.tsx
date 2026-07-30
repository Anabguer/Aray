import { Link } from 'react-router-dom'

export type WorldSceneVariant = 'hero' | 'side' | 'wide'

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
  const ariaLabel = available ? `Entrar a ${title}` : `${title}: próximamente`

  const body = (
    <>
      <img className="world-scene__art" src={imageSrc} alt={alt} draggable={false} />
      {available ? null : <span className="world-scene__veil" aria-hidden="true" />}
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
        <span
          className={`world-scene__cta${available ? ' world-scene__cta--enter' : ' world-scene__cta--soon'}`}
        >
          {available ? 'ENTRAR' : 'PRÓXIMAMENTE'}
        </span>
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
