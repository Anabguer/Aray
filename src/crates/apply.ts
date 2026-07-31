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
    },
    localDateString(),
  )
  const overflow = Math.max(0, reward.amount - grant.granted)
  return {
    next: {
      ...progress,
      reward: grant.reward,
    },
    granted: { kind: 'energy', amount: grant.granted },
    adjustmentNote:
      overflow > 0
        ? `Tope de energía de hoy: +${grant.granted} de ${reward.amount}`
        : null,
  }
}
