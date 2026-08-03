import { economyContract } from '@/config/economyContract'
import type { ProgressState } from '@/math/types'
import { XP_PER_LEVEL } from '@/progress/playerHud'
import { newId } from '@/progress/repository'
import { grantRewardPoints, localDateString } from '@/reward/engine'
import { levelFromXp } from '@/feedback/xpPreview'

export type LevelUpEvent = {
  newLevel: number
  energyGranted: number
  energyRequested: number
}

/** Si el XP cruzó umbral(es) de nivel, concede +N energía por cada nivel subido (idempotente). */
export function applyLevelUpEnergyBonuses(
  progressBeforeXp: ProgressState,
  progressAfterXp: ProgressState,
  playerKey: string,
  today: string = localDateString(),
): { next: ProgressState; events: LevelUpEvent[] } {
  const before = levelFromXp(progressBeforeXp.xp)
  const after = levelFromXp(progressAfterXp.xp)
  if (after <= before) {
    return { next: progressAfterXp, events: [] }
  }

  let next = progressAfterXp
  const events: LevelUpEvent[] = []
  const bonus = economyContract.levelUpEnergyBonus

  for (let level = before + 1; level <= after; level += 1) {
    const sessionId = `levelup-${playerKey}-${level}`.slice(0, 64)
    if (next.reward.appliedSessionIds.includes(sessionId)) continue
    const grant = grantRewardPoints(
      next.reward,
      {
        requestedPoints: bonus,
        sessionId,
        attemptIds: [newId('levelup-attempt')],
        ignoreDailyCap: true,
      },
      today,
    )
    next = { ...next, reward: grant.reward }
    events.push({
      newLevel: level,
      energyGranted: grant.granted,
      energyRequested: bonus,
    })
  }

  return { next, events }
}

export function xpProgressInLevel(totalXp: number): {
  level: number
  into: number
  perLevel: number
} {
  return {
    level: Math.floor(totalXp / XP_PER_LEVEL) + 1,
    into: totalXp % XP_PER_LEVEL,
    perLevel: XP_PER_LEVEL,
  }
}
