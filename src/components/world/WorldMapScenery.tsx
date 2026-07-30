import type { WorldTheme } from '@/components/world/types'

/** Decoración de escenario por asignatura (solo visual). */
export function WorldMapScenery({ theme }: { theme: WorldTheme }) {
  if (theme === 'maths') {
    return (
      <div className="map-scenery map-scenery--maths" aria-hidden="true">
        <span className="map-scenery__orb map-scenery__orb--a" />
        <span className="map-scenery__orb map-scenery__orb--b" />
        <span className="map-scenery__orb map-scenery__orb--c" />
        <span className="map-scenery__chip map-scenery__chip--a">2</span>
        <span className="map-scenery__chip map-scenery__chip--b">×</span>
        <span className="map-scenery__chip map-scenery__chip--c">8</span>
        <span className="map-scenery__chip map-scenery__chip--d">+</span>
        <span className="map-scenery__chip map-scenery__chip--e">9</span>
        <span className="map-scenery__crystal map-scenery__crystal--a" />
        <span className="map-scenery__crystal map-scenery__crystal--b" />
        <span className="map-scenery__crystal map-scenery__crystal--c" />
        <span className="map-scenery__float map-scenery__float--a" />
        <span className="map-scenery__float map-scenery__float--b" />
      </div>
    )
  }

  return <div className={`map-scenery map-scenery--${theme}`} aria-hidden="true" />
}
