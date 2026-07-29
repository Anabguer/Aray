import { rewardGoalConfig } from '@/config/rewardGoal'
import type { ProgressState, RewardGoalStatus, RewardProgress } from '@/math/types'

/** Fecha local YYYY-MM-DD (España / zona del usuario). Inyectable para tests. */
export function localDateString(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function createInitialRewardProgress(): RewardProgress {
  return {
    pointsTotal: 0,
    dailyDate: null,
    dailyPoints: 0,
    goalStatus: 'active',
    appliedSessionIds: [],
  }
}

export function syncRewardDay(reward: RewardProgress, today: string): RewardProgress {
  if (reward.dailyDate === today) return reward
  return {
    ...reward,
    dailyDate: today,
    dailyPoints: 0,
  }
}

export function remainingDailyCapacity(reward: RewardProgress, today: string): number {
  const synced = syncRewardDay(reward, today)
  if (synced.goalStatus === 'completed' || synced.goalStatus === 'validated') return 0
  const toGoal = Math.max(0, rewardGoalConfig.targetPoints - synced.pointsTotal)
  const toDaily = Math.max(0, rewardGoalConfig.dailyCap - synced.dailyPoints)
  return Math.min(toGoal, toDaily)
}

export function maxLoadableForSession(
  reward: RewardProgress,
  today: string,
  sessionCap: number,
): number {
  return Math.min(sessionCap, remainingDailyCapacity(reward, today))
}

export interface GrantRewardInput {
  requestedPoints: number
  sessionId: string
  attemptIds: string[]
}

export interface GrantRewardResult {
  reward: RewardProgress
  granted: number
  requested: number
  dailyComplete: boolean
  goalJustCompleted: boolean
  skippedDuplicateSession: boolean
}

/**
 * Concede puntos de recompensa respetando tope diario, tope total y anti-duplicado de sesión.
 * Los puntos sobrantes del request NO se arrastran al día siguiente.
 */
export function grantRewardPoints(
  reward: RewardProgress,
  input: GrantRewardInput,
  today: string = localDateString(),
): GrantRewardResult {
  let next = syncRewardDay(reward, today)

  if (next.appliedSessionIds.includes(input.sessionId)) {
    return {
      reward: next,
      granted: 0,
      requested: input.requestedPoints,
      dailyComplete: next.dailyPoints >= rewardGoalConfig.dailyCap || next.goalStatus !== 'active',
      goalJustCompleted: false,
      skippedDuplicateSession: true,
    }
  }

  if (next.goalStatus === 'completed' || next.goalStatus === 'validated') {
    return {
      reward: {
        ...next,
        appliedSessionIds: trimIds([...next.appliedSessionIds, input.sessionId]),
      },
      granted: 0,
      requested: input.requestedPoints,
      dailyComplete: true,
      goalJustCompleted: false,
      skippedDuplicateSession: false,
    }
  }

  const capacity = remainingDailyCapacity(next, today)
  const granted = Math.max(0, Math.min(input.requestedPoints, capacity))
  const pointsTotal = Math.min(rewardGoalConfig.targetPoints, next.pointsTotal + granted)
  const dailyPoints = next.dailyPoints + granted
  const goalJustCompleted =
    pointsTotal >= rewardGoalConfig.targetPoints && next.pointsTotal < rewardGoalConfig.targetPoints
  const goalStatus: RewardGoalStatus = goalJustCompleted ? 'completed' : next.goalStatus

  next = {
    ...next,
    pointsTotal,
    dailyPoints,
    dailyDate: today,
    goalStatus,
    appliedSessionIds: trimIds([...next.appliedSessionIds, input.sessionId]),
  }

  return {
    reward: next,
    granted,
    requested: input.requestedPoints,
    dailyComplete:
      next.dailyPoints >= rewardGoalConfig.dailyCap || next.goalStatus !== 'active',
    goalJustCompleted,
    skippedDuplicateSession: false,
  }
}

function trimIds(ids: string[], max = 40): string[] {
  return ids.length <= max ? ids : ids.slice(ids.length - max)
}

export function confirmAdultGoal(
  reward: RewardProgress,
): RewardProgress {
  if (reward.goalStatus !== 'completed') return reward
  return { ...reward, goalStatus: 'validated' }
}

export function resetRewardGoal(reward: RewardProgress, today: string = localDateString()): RewardProgress {
  return {
    ...createInitialRewardProgress(),
    dailyDate: today,
    dailyPoints: 0,
    appliedSessionIds: reward.appliedSessionIds,
  }
}

export function previewSessionLoad(progress: ProgressState, sessionCap: number, today?: string): number {
  const day = today ?? localDateString()
  return maxLoadableForSession(progress.reward, day, sessionCap)
}
