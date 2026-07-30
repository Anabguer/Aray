import { WorldMapScenery } from '@/components/world/WorldMapScenery'
import { WorldStationNode } from '@/components/world/WorldStationNode'
import type { WorldLevelMapProps, WorldStation } from '@/components/world/types'

/** Camino SVG escritorio: start → mid-high → mid-low → end */
function DesktopPath() {
  return (
    <svg
      className="world-level-map__path world-level-map__path--desktop"
      viewBox="0 0 1000 640"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mapPathGlow" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(34,211,238,0.95)" />
          <stop offset="45%" stopColor="rgba(167,139,250,0.9)" />
          <stop offset="100%" stopColor="rgba(56,189,248,0.85)" />
        </linearGradient>
        <filter id="mapPathBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <path
        className="world-level-map__path-glow"
        d="M155 545 C 250 545, 300 380, 445 165 C 510 80, 575 160, 640 500 C 675 585, 760 170, 875 115"
        fill="none"
        stroke="url(#mapPathGlow)"
        strokeWidth="18"
        strokeLinecap="round"
        filter="url(#mapPathBlur)"
        opacity="0.45"
      />
      <path
        className="world-level-map__path-line"
        d="M155 545 C 250 545, 300 380, 445 165 C 510 80, 575 160, 640 500 C 675 585, 760 170, 875 115"
        fill="none"
        stroke="url(#mapPathGlow)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray="2 18"
      />
    </svg>
  )
}

function MobilePath({ count }: { count: number }) {
  return (
    <div className="world-level-map__path world-level-map__path--mobile" aria-hidden="true">
      <span className="world-level-map__path-rail" />
      {Array.from({ length: Math.max(0, count - 1) }, (_, i) => (
        <span
          key={i}
          className="world-level-map__path-dot"
          style={{ top: `${((i + 0.5) / count) * 100}%` }}
        />
      ))}
    </div>
  )
}

function orderForMobile(stations: WorldStation[]): WorldStation[] {
  const rank: Record<WorldStation['mapSlot'], number> = {
    start: 0,
    'mid-high': 1,
    'mid-low': 2,
    end: 3,
  }
  return [...stations].sort((a, b) => rank[a.mapSlot] - rank[b.mapSlot])
}

export function WorldLevelMap({
  theme,
  title,
  tagline,
  icon,
  guideTip,
  stations,
}: WorldLevelMapProps) {
  const mobileOrder = orderForMobile(stations)

  return (
    <section className={`world-level-map world-level-map--${theme}`}>
      <WorldMapScenery theme={theme} />

      <header className="world-level-map__head">
        <div className="world-level-map__identity">
          <div className="world-level-map__icon">{icon}</div>
          <div className="world-level-map__titles">
            <h2 className="world-level-map__title">{title}</h2>
            <p className="world-level-map__tagline">{tagline}</p>
          </div>
        </div>
      </header>

      <div className="world-level-map__stage">
        <DesktopPath />
        <MobilePath count={mobileOrder.length} />

        <ol className="world-level-map__stations world-level-map__stations--desktop">
          {stations.map((station) => (
            <li
              key={station.id}
              className={`world-level-map__slot world-level-map__slot--${station.mapSlot}`}
            >
              <WorldStationNode
                station={station}
                guideTip={station.status === 'recommended' ? guideTip : undefined}
              />
            </li>
          ))}
        </ol>

        <ol className="world-level-map__stations world-level-map__stations--mobile">
          {mobileOrder.map((station) => (
            <li key={`m-${station.id}`} className="world-level-map__slot">
              <WorldStationNode
                station={station}
                guideTip={station.status === 'recommended' ? guideTip : undefined}
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
