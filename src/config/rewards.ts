/** Reglas de XP — centralizadas. Sin monedas de economía. */
export const rewardRules = {
  xpPerCorrect: 10,
  xpStreakBonusEvery: 5,
  xpStreakBonus: 10,
} as const

export const trainQuestionCount = 10
export const challengeDurationSec = 60

/** Umbrales simples de dominio por tabla (0–100). */
export const masteryThresholds = {
  learning: 25,
  solid: 55,
  mastered: 80,
} as const
