import type { ProgressState } from '@/math/types'
import { rewardGoalConfig } from '@/config/rewardGoal'
import { normalizeRewardCycles } from '@/reward/engine'

/** Misma escala de nivel que el Lobby. */
export const XP_PER_LEVEL = 100

export type PlayerHudSnapshot = {
  coins: number
  soundMuted: boolean
  level: number
  xpIntoLevel: number
  xpPerLevel: number
  xpPct: number
  energyToday: number
  energyCap: number
  energyBarPct: number
}

/** Deriva nivel, XP y energía del mismo progreso que usa el Lobby. */
export function derivePlayerHud(progress: ProgressState): PlayerHudSnapshot {
  const reward = normalizeRewardCycles(progress.reward)
  const energyToday = Math.min(reward.dailyPoints, rewardGoalConfig.dailyCap)
  const level = Math.floor(progress.xp / XP_PER_LEVEL) + 1
  const xpIntoLevel = progress.xp % XP_PER_LEVEL
  const xpPct = Math.min(100, Math.round((xpIntoLevel / XP_PER_LEVEL) * 100))
  const energyBarPct = Math.min(100, Math.round((energyToday / rewardGoalConfig.dailyCap) * 100))

  return {
    coins: progress.coins,
    soundMuted: progress.soundMuted,
    level,
    xpIntoLevel,
    xpPerLevel: XP_PER_LEVEL,
    xpPct,
    energyToday,
    energyCap: rewardGoalConfig.dailyCap,
    energyBarPct,
  }
}
