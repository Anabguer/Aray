/** Pesos de recompensa por tipo de actividad (tiempo estimado solo orientativo).
 * Escala ×10 respecto a v1 (números más visibles; misma cadencia real al premio).
 */
export const activityWeightDefaults = {
  micro: 10, // 10–30 s
  short: 20, // 1–2 min
  medium: 30, // 3–5 min
  long: 50, // 6–10 min
  special: 80, // 10–15 min
} as const

export type ActivityWeightTier = keyof typeof activityWeightDefaults

/** Meta / drop independiente de monedas/XP (validación adulta). */
export const rewardGoalConfig = {
  id: 'robux-500',
  title: 'Premio Robux',
  adultNoteApproxEuro: 'Valor orientativo ≈ 6 € (solo para el adulto).',
  childNoteFor: (tutorName: string) =>
    `Cuando llegues al premio, avísale a ${tutorName} para recogerlo.`,
  /** Escala ×10: mismos ~50 días a tope que con 500/10. */
  targetPoints: 5000,
  dailyCap: 100,
  dailyHint: 100,
  rewardLabel: '500 Robux',
} as const

/** Textos visibles (energía / premio). */
export const energyCopy = {
  today: (n: number, cap: number) => `Energía de hoy: ${n}/${cap}`,
  total: (n: number, target: number) => `${n} / ${target} de energía`,
  farmed: (n: number) => `¡Has farmeado +${n} de energía!`,
  sessionMax: (n: number) =>
    n > 0
      ? `Esta partida puede cargar hasta +${n} de energía`
      : '¡Barra del día llena! Si juegas más, es por vicio 🔥',
  dailyComplete: '¡Barra del día llena!',
  /** Cuando ya no suma al premio oficial pero puede seguir jugando. */
  playForFun:
    '¡Hemos llenado la barra de hoy! Si sigues jugando, es por vicio — XP y práctica siguen contando.',
  dropUnlockedFor: (tutorName: string) =>
    `¡Premio conseguido! Avísale a ${tutorName} para recogerlo`,
  streakOnFire: 'Tu racha está on fire',
  sourcesHint:
    'La energía sube al jugar, al subir de nivel, con cajas y al recoger logros.',
} as const

/** Una multiplicación correcta = microejercicio. */
export const tablesActivityMeta = {
  activityType: 'multiplication_item',
  subject: 'mates',
  skill: 'tablas',
  rewardWeight: activityWeightDefaults.micro,
  estimatedDuration: '10-30s',
  difficulty: 'adaptive',
  completionCriteria: 'correct_answer',
} as const

export const trainSessionMeta = {
  activityId: 'mates.tables.train',
  activityType: 'train_session',
  subject: 'mates',
  skill: 'tablas',
  maxRewardFromItems: 100,
  estimatedDuration: '3-5min',
} as const

export const challengeSessionMeta = {
  activityId: 'mates.tables.challenge',
  activityType: 'challenge_session',
  subject: 'mates',
  skill: 'tablas',
  maxRewardFromItems: 100,
  estimatedDuration: '1min',
} as const

export const matchSessionMeta = {
  activityId: 'mates.tables.match',
  activityType: 'match_table',
  subject: 'mates',
  skill: 'tablas',
  rewardWeight: activityWeightDefaults.medium,
  estimatedDuration: '3-5min',
  difficulty: 'standard',
  completionCriteria: 'all_pairs_correct',
  maxRewardFromItems: 30,
} as const

/** Energía por ronda completada (actividades sin session-submit de tablas). Respeta dailyCap. */
export const sideActivityEnergy = {
  calc: activityWeightDefaults.short, // 20
  spelling: activityWeightDefaults.medium, // 30
  money: activityWeightDefaults.short, // 20
  clocks: activityWeightDefaults.short, // 20
  dailyBonus: activityWeightDefaults.special, // 80
} as const
