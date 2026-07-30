import type { WorldTheme } from '@/components/world/types'

/** Ambiente tenue: solo halos radiales y partículas, sin lámina rectangular. */
export function WorldMapScenery({ theme }: { theme: WorldTheme }) {
  return (
    <div className={`map-scenery map-scenery--${theme}`} aria-hidden="true">
      <span className="map-scenery__orb map-scenery__orb--a" />
      <span className="map-scenery__orb map-scenery__orb--b" />
      <span className="map-scenery__orb map-scenery__orb--c" />
      <span className="map-scenery__dust map-scenery__dust--a" />
      <span className="map-scenery__dust map-scenery__dust--b" />
      <span className="map-scenery__dust map-scenery__dust--c" />
    </div>
  )
}
