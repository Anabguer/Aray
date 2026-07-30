import { Link } from 'react-router-dom'
import { Lumo } from '@/lumo/Lumo'
import { ZoneMark } from '@/components/world/ZoneMark'
import type { WorldStation, WorldZoneMark } from '@/components/world/types'

const statusLabel: Record<WorldStation['status'], string> = {
  available: 'Disponible',
  recommended: 'Recomendado',
  completed: 'Completado',
  'coming-soon': 'Próximamente',
}

function StationAmbient({ mark }: { mark: WorldZoneMark }) {
  if (mark === 'calc') {
    return (
      <div className="map-station__ambient map-station__ambient--calc" aria-hidden="true">
        <span>2</span>
        <span>+</span>
        <span>7</span>
      </div>
    )
  }
  if (mark === 'problems') {
    return (
      <div className="map-station__ambient map-station__ambient--problems" aria-hidden="true">
        <span className="map-station__puzzle" />
        <span className="map-station__q">?</span>
      </div>
    )
  }
  if (mark === 'clocks') {
    return (
      <div className="map-station__ambient map-station__ambient--clocks" aria-hidden="true">
        <span className="map-station__clock-ring" />
        <span className="map-station__clock-hand" />
      </div>
    )
  }
  return (
    <div className="map-station__ambient map-station__ambient--tables" aria-hidden="true">
      <span>×</span>
      <span>3</span>
    </div>
  )
}

function PlayMark() {
  return (
    <svg className="map-station__play" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5L8 5.5z" fill="currentColor" />
    </svg>
  )
}

export function WorldStationNode({
  station,
  guideTip,
}: {
  station: WorldStation
  guideTip?: string
}) {
  const active = station.status === 'recommended' || station.status === 'available'
  const playable = Boolean(station.href) && station.status !== 'coming-soon'
  const showGuide = Boolean(guideTip) && station.status === 'recommended'

  return (
    <article
      className={[
        'map-station',
        `map-station--${station.status}`,
        `map-station--mark-${station.mark}`,
        active ? 'map-station--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`${station.title}. ${statusLabel[station.status]}`}
    >
      <span className="map-station__port" aria-hidden="true" />
      <span className="map-station__halo" aria-hidden="true" />

      <div className="map-station__platform">
        <StationAmbient mark={station.mark} />
        <span className="map-station__edge" aria-hidden="true" />

        <div className="map-station__content">
          <div className="map-station__top">
            <ZoneMark mark={station.mark} />
            <div className="map-station__copy">
              <span className={`map-station__seal map-station__seal--${station.status}`}>
                {statusLabel[station.status]}
              </span>
              <h3 className="map-station__title">{station.title}</h3>
              <p className="map-station__desc">{station.description}</p>
            </div>
          </div>

          {playable && station.href ? (
            <Link to={station.href} className="map-station__cta">
              <PlayMark />
              <span>{station.ctaLabel ?? 'ENTRAR'}</span>
            </Link>
          ) : null}
        </div>

        {showGuide ? (
          <>
            <div className="map-station__lumo-peek" aria-hidden="true">
              <Lumo state="idle" intensity={2} size="sm" className="map-station__lumo" label="Lumo" />
            </div>
            <p className="map-station__bubble" role="status">
              {guideTip}
            </p>
          </>
        ) : null}
      </div>
    </article>
  )
}
