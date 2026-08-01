/**
 * Contratos genéricos del sistema de minijuegos (Fase 0).
 * El producto es el minijuego; el pack es solo datos.
 */

export type AreaId = 'languages' | 'maths' | 'english' | 'medi'

export type MechanicId =
  | 'mcq'
  | 'ordenar-letras'
  /** Ortografía alimentada por packs de lemas / frases JSON. */
  | 'ortografia-lemma-mcq'

export type PackRevisionStatus = 'draft' | 'approved'

export type MinigameSource = 'legacy' | 'pack'

export type MinigameStatus = 'active' | 'coming-soon'

/** Ítem genérico: identidad estable dentro de un pack. */
export type PackItemBase = {
  id: string
}

/** Contrato MCQ reutilizable (Ortografía, sinónimos, mates, …). Sin contenido. */
export type McqPackItem = PackItemBase & {
  enunciado: string
  opciones: string[]
  /** Índice 0-based en `opciones`. */
  correcta: number
  explicacion?: string
  display?: string
  emoji?: string
}

/** Pack de datos revisado. Fase 0: tipos listos; Ortografía aún no migra packs. */
export type DataPack<T extends PackItemBase = PackItemBase> = {
  id: string
  nombre: string
  version: number
  nivel?: string
  objetivo?: string
  mecanica: MechanicId
  estadoRevision: PackRevisionStatus
  items: T[]
}

export type MechanicDefinition = {
  id: MechanicId
  /** Descripción interna (no UI educativa). */
  label: string
  /** Si true, solo existe vía adaptador legacy. */
  temporaryLegacy?: boolean
}

export type MinigameDefinition = {
  id: string
  area: AreaId
  category: string
  title: string
  href: string
  mechanicId: MechanicId
  source: MinigameSource
  status: MinigameStatus
  /**
   * Modo legacy de Ortografía (`SpellPlayMode`).
   * Solo cuando `source === 'legacy'` y `mechanicId === 'legacy-spell'`.
   */
  legacySpellMode?: string
  /** Packs asociados (vacío mientras el minijuego sea legacy). */
  packIds: string[]
}
