import { Link } from 'react-router-dom'
import { Lumo } from '@/lumo/Lumo'
import { ZoneMark } from '@/components/world/ZoneMark'
import type { WorldStation } from '@/components/world/types'

const statusLabel: Record<WorldStation['status'], string> = {
  available: 'Disponible',
  recommended: 'Recomendado',
  completed: 'Completado',
  'coming-soon': 'Próximamente',
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
        `map-station--${station.mapSlot}`,
        `map-station--mark-${station.mark}`,
        active ? 'map-station--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`${station.title}. ${statusLabel[station.status]}`}
    >
      <div className="map-station__island" aria-hidden="true">
        <span className="map-station__ring" />
        <span className="map-station__pad" />
      </div>

      <div className="map-station__core">
        <ZoneMark mark={station.mark} />
        <span className={`map-station__seal map-station__seal--${station.status}`}>
          {statusLabel[station.status]}
        </span>
        <h3 className="map-station__title">{station.title}</h3>
        <p className="map-station__desc">{station.description}</p>
        {playable && station.href ? (
          <Link to={station.href} className="map-station__cta">
            {station.ctaLabel ?? 'ENTRAR'}
          </Link>
        ) : null}
      </div>

      {showGuide ? (
        <div className="map-station__guide" role="status">
          <Lumo state="idle" intensity={1} size="sm" className="map-station__lumo" />
          <p className="map-station__tip">{guideTip}</p>
        </div>
      ) : null}
    </article>
  )
}
