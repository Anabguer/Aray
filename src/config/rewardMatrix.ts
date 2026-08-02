import { activityWeightDefaults, sideActivityEnergy } from '@/config/rewardGoal'
import { economyContract } from '@/config/economyContract'
import { rewardRules } from '@/config/rewards'

/** Qué otorga cada actividad jugable (economía simplificada). */
export type RewardActivityId =
  | 'tables-learn'
  | 'tables-train'
  | 'tables-challenge'
  | 'tables-match'
  | 'tables-misses'
  | 'alphabet'
  | 'calc'
  | 'money'
  | 'spelling'
  | 'english'
  | 'clocks-learn'
  | 'clocks-train'
  | 'clocks-match'

export type ActivityRewardSpec = {
  /** XP por acierto (0 = no da XP). */
  xpPerCorrect: number
  /** Si true, al cerrar sesión aplica energía vía pipeline existente. */
  grantsEnergy: boolean
  /** Energía fija de sesión (sides); null = por aciertos / meta tablas. */
  sessionEnergy: number | null
}

export const rewardMatrix: Record<RewardActivityId, ActivityRewardSpec> = {
  'tables-learn': {
    xpPerCorrect: rewardRules.xpPerCorrect,
    grantsEnergy: false,
    sessionEnergy: null,
  },
  'tables-train': {
    xpPerCorrect: rewardRules.xpPerCorrect,
    grantsEnergy: true,
    sessionEnergy: null,
  },
  'tables-challenge': {
    xpPerCorrect: rewardRules.xpPerCorrect,
    grantsEnergy: true,
    sessionEnergy: null,
  },
  'tables-match': {
    xpPerCorrect: rewardRules.xpPerCorrect,
    grantsEnergy: true,
    sessionEnergy: activityWeightDefaults.medium,
  },
  'tables-misses': {
    xpPerCorrect: rewardRules.xpPerCorrect,
    grantsEnergy: true,
    sessionEnergy: null,
  },
  alphabet: {
    xpPerCorrect: rewardRules.xpPerCorrect,
    grantsEnergy: true,
    sessionEnergy: activityWeightDefaults.medium,
  },
  calc: {
    xpPerCorrect: rewardRules.xpPerCorrect,
    grantsEnergy: true,
    sessionEnergy: sideActivityEnergy.calc,
  },
  money: {
    xpPerCorrect: rewardRules.xpPerCorrect,
    grantsEnergy: true,
    sessionEnergy: sideActivityEnergy.money,
  },
  spelling: {
    xpPerCorrect: rewardRules.xpPerCorrect,
    grantsEnergy: true,
    sessionEnergy: sideActivityEnergy.spelling,
  },
  /** XP de práctica; no usa cupos de misión diaria (no contamina Ortografía). */
  english: {
    xpPerCorrect: rewardRules.xpPerCorrect,
    grantsEnergy: false,
    sessionEnergy: null,
  },
  'clocks-learn': {
    xpPerCorrect: 0,
    grantsEnergy: false,
    sessionEnergy: null,
  },
  'clocks-train': {
    xpPerCorrect: rewardRules.xpPerCorrect,
    grantsEnergy: true,
    sessionEnergy: sideActivityEnergy.clocks,
  },
  'clocks-match': {
    xpPerCorrect: rewardRules.xpPerCorrect,
    grantsEnergy: true,
    sessionEnergy: sideActivityEnergy.clocks,
  },
}

export { economyContract }

/** XP de sesión por número de aciertos (+ rachas simples opcionales vía caller). */
export function sessionXpFromCorrects(correctCount: number, xpPerCorrect: number): number {
  if (xpPerCorrect <= 0 || correctCount <= 0) return 0
  return correctCount * xpPerCorrect
}
