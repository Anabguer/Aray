/** Catálogo educativo central — independiente de la pantalla y del curso activo. */

export type CourseId = 'primary-3' | 'primary-4' | 'primary-5'

export type SubjectId = 'maths' | 'languages' | 'english'

export type BlockId =
  | 'multiplication-tables'
  | 'calculation'
  | 'problems'
  | 'clocks-hours'
  | 'alphabet'
  | 'words'
  | 'spelling'
  | 'vocabulary'
  | 'word-image'
  | 'simple-phrases'

export type ExerciseType =
  | 'learn'
  | 'complete'
  | 'multiple-choice'
  | 'timed'
  | 'spot-error'
  | 'match'
  | 'mixed'

export type Difficulty = 'basic' | 'medium' | 'advanced'

/** Estado del contenido en el catálogo global. */
export type CatalogStatus = 'active' | 'hidden' | 'future'

/**
 * Rol de una actividad respecto a un curso / asignación adulta.
 * - recommended: misión sugerida
 * - mandatory: pendiente obligatoria
 * - free: desbloqueada libre
 * - review: repaso de curso anterior u opcional
 * - hidden: no visible para Aray
 */
export type AssignmentRole = 'recommended' | 'mandatory' | 'free' | 'review' | 'hidden'

export type CourseMode = 'standard' | 'review'

export interface CourseDefinition {
  id: CourseId
  title: string
  shortTitle: string
  stage: 'primary'
  grade: 3 | 4 | 5
  status: CatalogStatus
  sortOrder: number
}

export interface SubjectDefinition {
  id: SubjectId
  title: string
  shortTitle: string
  description: string
  /** Mapeo a iconos / rutas legacy del hub. */
  legacyHubId: 'mates' | 'catala' | 'castellano' | 'angles' | 'medi'
  worldPath: string
  status: CatalogStatus
  sortOrder: number
}

export interface BlockDefinition {
  id: BlockId
  subjectId: SubjectId
  title: string
  description: string
  status: CatalogStatus
  sortOrder: number
}

export interface SkillDefinition {
  id: string
  blockId: BlockId
  title: string
  description: string
  /**
   * Clave de progreso compartida entre modalidades.
   * Para tablas: "2"…"9" (sigue alimentando ProgressState.tables).
   */
  progressKey: string
  progressKind: 'multiplication-table' | 'generic'
  recommendedCourses: CourseId[]
  status: CatalogStatus
  sortOrder: number
}

export interface ActivityRewards {
  xpWeight: number
  coinWeight: number
  energyWeight: number
}

export interface ActivityDefinition {
  id: string
  title: string
  description: string
  skillId: string
  exerciseType: ExerciseType
  difficulty: Difficulty
  status: CatalogStatus
  sortOrder: number
  rewards: ActivityRewards
  /** Config propia del ejercicio (ruta, modo de juego, tabla, etc.). */
  config: Record<string, unknown>
}

export interface CourseActivityAssignment {
  courseId: CourseId
  activityId: string
  role: AssignmentRole
  sortOrder: number
}

export interface CourseHistoryEntry {
  courseId: CourseId
  mode: CourseMode
  startedAt: string
  endedAt: string | null
}

export interface SchoolProfile {
  currentCourseId: CourseId
  /** Desde cuándo está en el curso actual. */
  courseStartedAt: string
  /** standard = curso en marcha; review = repaso del curso indicado. */
  courseMode: CourseMode
  history: CourseHistoryEntry[]
}

/** Overrides del adulto por actividad (no borra progreso). */
export type ActivityAssignmentMap = Record<string, AssignmentRole>

export interface LobbyMissionCard {
  activityId: string
  title: string
  description: string
  subjectId: SubjectId
  blockId: BlockId
  skillId: string
  role: AssignmentRole
  path: string
  reason: 'recommended' | 'mandatory' | 'review' | 'free' | 'daily_challenge'
  /** Tabla de la actividad (si aplica); el path de juego es genérico y hace falta fijarla en PlayContext. */
  table?: number
  playMode?: string
}
