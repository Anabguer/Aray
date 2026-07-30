import { challengeModeConfig } from '@/config/playConfig'
import { rewardRules } from '@/config/rewards'
import { XP_PER_LEVEL } from '@/progress/playerHud'
import { calculateSessionRewards } from '@/progress/repository'
import type { SessionAnswer, SessionResult } from '@/math/types'

export function xpMultipliersForMode(mode: SessionResult['mode']): {
  xpMultiplier?: number
  coinMultiplier?: number
} {
  if (mode === 'challenge') {
    return {
      xpMultiplier: challengeModeConfig.xpMultiplier,
      coinMultiplier: challengeModeConfig.coinMultiplier,
    }
  }
  return {}
}

/** XP total que se guardará para estas respuestas (mismas reglas que el repo). */
export function sessionXpEarned(
  mode: SessionResult['mode'],
  answers: SessionAnswer[],
  score = 0,
  previousBestChallenge = 0,
): number {
  return calculateSessionRewards(
    mode,
    answers,
    previousBestChallenge,
    score,
    xpMultipliersForMode(mode),
  ).xpEarned
}

/** Delta de XP al añadir una respuesta correcta (0 si incorrecta). */
export function xpDeltaForAnswer(
  mode: SessionResult['mode'],
  previousAnswers: SessionAnswer[],
  nextAnswer: SessionAnswer,
): number {
  if (!nextAnswer.correct) return 0
  const before = sessionXpEarned(mode, previousAnswers)
  const after = sessionXpEarned(mode, [...previousAnswers, nextAnswer])
  return after - before
}

/** XP base por acierto (sin bonus de racha), con multiplicador de modo. */
export function baseXpPerCorrect(mode: SessionResult['mode']): number {
  const mult = xpMultipliersForMode(mode).xpMultiplier ?? 1
  return rewardRules.xpPerCorrect * mult
}

export type XpBarView = {
  level: number
  xpIntoLevel: number
  xpPerLevel: number
  xpPct: number
  totalXp: number
}

export function xpBarFromTotal(totalXp: number): XpBarView {
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1
  const xpIntoLevel = totalXp % XP_PER_LEVEL
  const xpPct = Math.min(100, Math.round((xpIntoLevel / XP_PER_LEVEL) * 100))
  return {
    level,
    xpIntoLevel,
    xpPerLevel: XP_PER_LEVEL,
    xpPct,
    totalXp,
  }
}

export function levelFromXp(totalXp: number): number {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1
}

export const wrongRetryMessages = [
  'Casi, prueba otra vez',
  'Mira bien la operación',
] as const

export function pickWrongRetryMessage(seed = Date.now()): string {
  return wrongRetryMessages[seed % wrongRetryMessages.length]
}
