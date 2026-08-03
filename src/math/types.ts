export type TableNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export interface MultiplicationFact {
  a: number
  b: number
  product: number
}

/** Clave canónica: 3×7 y 7×3 comparten seguimiento. */
export type FactKey = string

export type MasteryLevel = 'new' | 'learning' | 'solid' | 'mastered'

export type PlayMode = 'learn' | 'train' | 'challenge' | 'misses' | 'match'

export interface FactStats {
  attempts: number
  correct: number
  wrong: number
  /** Peso relativo para reaparición (sube al fallar, baja al acertar). */
  weight: number
  lastSeenAt: string | null
}

export interface TableProgress {
  practiced: boolean
  attempts: number
  correct: number
  masteryScore: number
  lastPracticedAt: string | null
  /** Mejor resultado histórico de ronda evaluable (0–10 a la primera). */
  bestRoundScore: number
  /** Última ronda evaluable (0–10); null si aún no hay. */
  lastRoundScore: number | null
  /** Rondas consecutivas con resultado bajo (< 8/10). */
  consecutiveLowRounds: number
  /** Alguna vez alcanzó Domada (8/10+); no se pierde por una mala ronda. */
  everMastered: boolean
}

export type RewardGoalStatus = 'active' | 'completed' | 'validated'

/** Progreso exclusivo de la meta de recompensa (independiente de monedas). */
export interface RewardProgress {
  pointsTotal: number
  dailyDate: string | null
  dailyPoints: number
  goalStatus: RewardGoalStatus
  /** Ciclo activo actual (Premio N). */
  currentCycleNumber: number
  /** Premios conseguidos pendientes de entrega adulta. */
  pendingCycleNumbers: number[]
  /** Premios ya entregados (historial / vitrina). */
  deliveredCycleNumbers: number[]
  /** Celebraciones ya mostradas (no repetir al reabrir). */
  celebratedPendingCycles: number[]
  appliedSessionIds: string[]
}

export interface ProgressState {
  /** v6: energía misión+reto (meta 6000 / tope 100). v5 = ABC; v4 = escolar. */
  version: 4 | 5 | 6
  xp: number
  coins: number
  bestStreak: number
  bestChallengeScore: number
  lastPracticeAt: string | null
  facts: Record<FactKey, FactStats>
  tables: Record<string, TableProgress>
  soundMuted: boolean
  reward: RewardProgress
  crates: import('@/crates/engine').CratesState
  achievements: {
    claimedIds: string[]
  }
  /** Contadores para desbloquear logros (tiempo, sesiones, features). */
  stats: import('@/achievements/stats').ProgressStats
  /** Curso activo e historial; el cambio de curso no reinicia recompensas ni dominio. */
  school: import('@/curriculum/types').SchoolProfile
  /** Overrides del panel adulto por activityId. */
  activityAssignments: import('@/curriculum/types').ActivityAssignmentMap
  /** Progreso del bloque ABC (lenguas). */
  alphabet: import('@/alphabet/progress').AlphabetProgress
}

export interface SessionAnswer {
  fact: MultiplicationFact
  correct: boolean
  selected: number
  elapsedMs: number
  /** Identificador único del intento (anti doble clic / reaplicación). */
  attemptId: string
  /** Acierto a la primera en esa pregunta (undefined = sí, p. ej. reto). */
  firstTry?: boolean
}

export interface SessionResult {
  mode: PlayMode
  tables: number[]
  answers: SessionAnswer[]
  score: number
  bestStreak: number
  xpEarned: number
  coinsEarned: number
  personalBest: boolean
  missedFacts: MultiplicationFact[]
  sessionId: string
  rewardPointsEarned: number
  rewardPointsRequested: number
  rewardDailyComplete: boolean
  rewardGoalJustCompleted: boolean
  rewardDailyPoints: number
  rewardPointsTotal: number
}

export interface QuestionCard {
  fact: MultiplicationFact
  options: number[]
}

export interface ActivityMeta {
  activityId: string
  activityType: string
  rewardWeight: number
  estimatedDuration: string
  difficulty: string
  subject: string
  skill: string
  completionCriteria: string
}
