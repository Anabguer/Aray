export type WorldTheme = 'maths' | 'languages' | 'english' | 'medi'

export type WorldZoneStatus = 'available' | 'recommended' | 'completed' | 'coming-soon'

export type WorldZoneMark =
  | 'tables'
  | 'calc'
  | 'problems'
  | 'money'
  | 'clocks'
  | 'alphabet'
  | 'writing'
  | 'reading'
  | 'spelling'
  | 'words'
  | 'match'
  | 'phrases'
  | 'nature'
  | 'body'
  | 'map'

/** Posición en el mapa de escritorio (zigzag). */
export type MapSlot = 'start' | 'mid-high' | 'mid-low' | 'end'

export type WorldStation = {
  id: string
  title: string
  description: string
  status: WorldZoneStatus
  mark: WorldZoneMark
  mapSlot: MapSlot
  href?: string
  ctaLabel?: string
}

export type WorldLevelMapProps = {
  theme: WorldTheme
  /** Frase de Lumo junto a la estación activa. */
  guideTip?: string
  stations: WorldStation[]
}
