/** Pesos de recompensa por tipo de actividad (tiempo estimado solo orientativo). */
export const activityWeightDefaults = {
  micro: 1, // 10–30 s
  short: 2, // 1–2 min
  medium: 3, // 3–5 min
  long: 5, // 6–10 min
  special: 8, // 10–15 min
} as const

export type ActivityWeightTier = keyof typeof activityWeightDefaults

/** Meta / drop independiente de monedas/XP (validación adulta). */
export const rewardGoalConfig = {
  id: 'robux-500',
  title: 'Próximo drop: 500 Robux',
  adultNoteApproxEuro: 'Valor orientativo ≈ 6 € (solo para el adulto).',
  childNote: 'El drop lo valida un adulto. La energía no son monedas de ARAY.',
  targetPoints: 300,
  dailyCap: 10,
  dailyHint: 10,
  rewardLabel: '500 Robux',
} as const

/** Textos visibles para Aray (energía / drop). */
export const energyCopy = {
  today: (n: number, cap: number) => `Energía de hoy: ${n}/${cap}`,
  total: (n: number, target: number) => `Energía total: ${n}/${target}`,
  farmed: (n: number) => `¡Has farmeado +${n} de energía!`,
  sessionMax: (n: number) =>
    n > 0 ? `Esta partida puede cargar hasta +${n} de energía` : 'Hoy ya está completa la carga diaria',
  dropUnlocked: '¡Drop desbloqueado! Pendiente de validar por un adulto',
  dailyComplete: '¡Carga diaria completa!',
  streakOnFire: 'Tu racha está on fire',
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
  maxRewardFromItems: 10,
  estimatedDuration: '3-5min',
} as const

export const challengeSessionMeta = {
  activityId: 'mates.tables.challenge',
  activityType: 'challenge_session',
  subject: 'mates',
  skill: 'tablas',
  maxRewardFromItems: 10,
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
  maxRewardFromItems: 3,
} as const
