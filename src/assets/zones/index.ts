import calc from './calc.png'
import clocks from './clocks.png'
import problems from './problems.png'
import tables from './tables.png'
import type { WorldZoneMark } from '@/components/world/types'

/** Miniilustraciones 3D de zonas del mapa (mates). */
export const zoneMarkArt: Partial<Record<WorldZoneMark, string>> = {
  tables,
  calc,
  problems,
  clocks,
}

export function zoneMarkArtUrl(mark: WorldZoneMark): string | undefined {
  return zoneMarkArt[mark]
}
