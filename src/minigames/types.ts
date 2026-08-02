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
  /** Inglés vocabulario desde packs JSON (sin errors[]). */
  | 'english-lemma-mcq'
  /**
   * Matemáticas procedurales (tablas/cálculo/dinero/horas) vía adaptadores legacy.
   * Contenido aún no migrado a packs JSON.
   */
  | 'maths-legacy'

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

/** Forma de presentación reutilizable (sin extraer pantallas todavía). */
export type MathsPresentation =
  | 'mcq'
  | 'match'
  | 'learn'
  | 'timer'
  | 'build'
  | 'order'
  | 'compare'
  | 'truefalse'
  | 'review'
  | 'summary'

export type MinigameDefinition = {
  id: string
  area: AreaId
  category: string
  /** Nombre visible (equivalente a «nombre»). */
  title: string
  /** Ruta de pantalla (equivalente a «pantalla»). */
  href: string
  mechanicId: MechanicId
  source: MinigameSource
  status: MinigameStatus
  /** Modo de Ortografía (`SpellPlayMode`) cuando `mechanicId === 'ortografia-lemma-mcq'`. */
  spellPlayMode?: string
  /** Modo de Inglés (`EnglishPlayMode`) cuando `mechanicId === 'english-lemma-mcq'`. */
  englishPlayMode?: string
  /** Modo de play matemático (`calc-add`, `tables-train`, …). */
  mathPlayMode?: string
  /** Clave de arte / icono de modo (StageSelect). */
  icon?: string
  /** Skills curriculares asociados. */
  skillIds?: string[]
  /** Mecánica de presentación (MCQ / Match / Learn / Timer…). */
  presentation?: MathsPresentation
  /** Packs editoriales asociados. */
  packIds: string[]
}
