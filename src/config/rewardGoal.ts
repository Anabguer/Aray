/**
 * Economía premio Robux: misión del día + 1 reto ≈ tope diario;
 * ~60 días a tope → premio (6000).
 */
export const activityWeightDefaults = {
  micro: 5, // unidad misión (tablas / skill)
  short: 5,
  medium: 5,
  long: 10,
  special: 10, // reto diario
} as const

export type ActivityWeightTier = keyof typeof activityWeightDefaults

/** Meta / drop independiente de monedas/XP (validación adulta). */
export const rewardGoalConfig = {
  id: 'robux-500',
  title: 'Premio Robux',
  adultNoteApproxEuro: 'Valor orientativo ≈ 6 € (solo para el adulto).',
  childNoteFor: (tutorName: string) =>
    `Cuando llegues al premio, avísale a ${tutorName} para recogerlo.`,
  /** ~60 días × 100 = 6000. */
  targetPoints: 6000,
  dailyCap: 100,
  dailyHint: 100,
  rewardLabel: '500 Robux',
} as const

/**
 * Energía por unidad de misión del día + Reto del día (card aleatoria del lobby).
 * 6×5 + 5×5 + 4×5 + 2×5 + 1×5 + 10 (reto) = 100.
 */
export const missionEnergyConfig = {
  perUnit: {
    tables: 5,
    calc: 5,
    spelling: 5,
    clocks: 5,
    money: 5,
  },
  /** Bonus al completar el Reto del día (card JUGAR del lobby). */
  challengeDaily: 10,
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
  playForFunTitle: '¡Barra de hoy llena!',
  playForFun:
    'Si sigues jugando, es por vicio — XP y práctica siguen contando.',
  playForFunLong:
    '¡Hemos llenado la barra de hoy! Si sigues jugando, es por vicio — XP y práctica siguen contando.',
  dropUnlockedFor: (tutorName: string) =>
    `¡Premio conseguido! Avísale a ${tutorName} para recogerlo`,
  streakOnFire: 'Tu racha está on fire',
  sourcesHint:
    'La energía del premio sube con la misión del día y el Reto del día. Cajas y logros pueden sumar un poco extra.',
  challengeCta: 'Reto del día',
  challengeDone: 'Reto del día hecho',
} as const

/** Una multiplicación correcta = 1 unidad de misión tablas (si quedan slots). */
export const tablesActivityMeta = {
  activityType: 'multiplication_item',
  subject: 'mates',
  skill: 'tablas',
  rewardWeight: missionEnergyConfig.perUnit.tables,
  estimatedDuration: '10-30s',
  difficulty: 'adaptive',
  completionCriteria: 'correct_answer',
} as const

export const trainSessionMeta = {
  activityId: 'mates.tables.train',
  activityType: 'train_session',
  subject: 'mates',
  skill: 'tablas',
  maxRewardFromItems: 30, // 6 × 5
  estimatedDuration: '3-5min',
} as const

export const challengeSessionMeta = {
  activityId: 'mates.tables.challenge',
  activityType: 'challenge_session',
  subject: 'mates',
  skill: 'tablas',
  maxRewardFromItems: 30, // slots misión tablas
  estimatedDuration: '1min',
} as const

export const matchSessionMeta = {
  activityId: 'mates.tables.match',
  activityType: 'match_table',
  subject: 'mates',
  skill: 'tablas',
  rewardWeight: missionEnergyConfig.perUnit.tables,
  estimatedDuration: '3-5min',
  difficulty: 'standard',
  completionCriteria: 'all_pairs_correct',
  maxRewardFromItems: 30,
} as const

/**
 * Energía máxima teórica por skill si completa todos los slots de misión
 * (compat: callers que esperaban flat por ronda).
 */
export const sideActivityEnergy = {
  calc: missionEnergyConfig.perUnit.calc * 5,
  spelling: missionEnergyConfig.perUnit.spelling * 4,
  money: missionEnergyConfig.perUnit.money * 1,
  clocks: missionEnergyConfig.perUnit.clocks * 2,
  challengeDaily: missionEnergyConfig.challengeDaily,
} as const
