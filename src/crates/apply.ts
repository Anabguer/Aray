import type { CrateRewardSpec } from '@/config/crateConfig'
import type { ProgressState } from '@/math/types'
import { newId } from '@/progress/repository'
import { grantRewardPoints, localDateString } from '@/reward/engine'

export interface AppliedCrateReward {
  next: ProgressState
  granted: CrateRewardSpec
  adjustmentNote: string | null
}

/** Aplica premio de caja (solo energía). */
export function applyCrateRewardToProgress(
  progress: ProgressState,
  reward: CrateRewardSpec,
): AppliedCrateReward {
  const grant = grantRewardPoints(
    progress.reward,
    {
      requestedPoints: reward.amount,
      sessionId: newId('crate-energy'),
      attemptIds: [newId('crate-attempt')],
      ignoreDailyCap: true,
    },
    localDateString(),
  )
  return {
    next: {
      ...progress,
      reward: grant.reward,
    },
    granted: { kind: 'energy', amount: grant.granted },
    adjustmentNote: null,
  }
}
