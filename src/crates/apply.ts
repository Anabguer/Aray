import { crateConfig, type CrateRewardSpec } from '@/config/crateConfig'
import type { ProgressState } from '@/math/types'
import { newId } from '@/progress/repository'
import { grantRewardPoints, localDateString } from '@/reward/engine'

export interface AppliedCrateReward {
  next: ProgressState
  granted: CrateRewardSpec
  adjustmentNote: string | null
}

/** Aplica premio de caja al saldo (una sola vez, caller ya hizo collect idempotente). */
export function applyCrateRewardToProgress(
  progress: ProgressState,
  reward: CrateRewardSpec,
): AppliedCrateReward {
  if (reward.kind === 'coins') {
    return {
      next: { ...progress, coins: progress.coins + reward.amount },
      granted: reward,
      adjustmentNote: null,
    }
  }
  if (reward.kind === 'xp') {
    return {
      next: { ...progress, xp: progress.xp + reward.amount },
      granted: reward,
      adjustmentNote: null,
    }
  }

  const grant = grantRewardPoints(
    progress.reward,
    {
      requestedPoints: reward.amount,
      sessionId: newId('crate-energy'),
      attemptIds: [newId('crate-attempt')],
    },
    localDateString(),
  )
  const overflow = Math.max(0, reward.amount - grant.granted)
  const coinsBonus = overflow * crateConfig.energyOverflowToCoins
  return {
    next: {
      ...progress,
      reward: grant.reward,
      coins: progress.coins + coinsBonus,
    },
    granted: { kind: 'energy', amount: grant.granted },
    adjustmentNote:
      overflow > 0
        ? `Tope de energía: +${grant.granted} energía y +${coinsBonus} monedas`
        : null,
  }
}
