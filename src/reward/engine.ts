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
    currentCycleNumber: 1,
    pendingCycleNumbers: [],
    deliveredCycleNumbers: [],
    celebratedPendingCycles: [],
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
  // Los premios pendientes NO bloquean seguir ganando puntos para el siguiente ciclo.
  const toDaily = Math.max(0, rewardGoalConfig.dailyCap - synced.dailyPoints)
  return toDaily
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
  cyclesJustCompleted: number[]
  skippedDuplicateSession: boolean
}

/**
 * Concede puntos de recompensa respetando tope diario.
 * Al alcanzar el objetivo del ciclo, el sobrante pasa al siguiente (no se pierde).
 */
export function grantRewardPoints(
  reward: RewardProgress,
  input: GrantRewardInput,
  today: string = localDateString(),
): GrantRewardResult {
  let next = normalizeRewardCycles(syncRewardDay(reward, today))
  const target = rewardGoalConfig.targetPoints

  if (next.appliedSessionIds.includes(input.sessionId)) {
    return {
      reward: next,
      granted: 0,
      requested: input.requestedPoints,
      dailyComplete: next.dailyPoints >= rewardGoalConfig.dailyCap,
      goalJustCompleted: false,
      cyclesJustCompleted: [],
      skippedDuplicateSession: true,
    }
  }

  const capacity = remainingDailyCapacity(next, today)
  const granted = Math.max(0, Math.min(input.requestedPoints, capacity))
  let remaining = granted
  let points = next.pointsTotal
  let cycleNumber = next.currentCycleNumber
  const pending = [...next.pendingCycleNumbers]
  const cyclesJustCompleted: number[] = []

  while (remaining > 0) {
    const need = Math.max(0, target - points)
    if (need === 0) {
      // Ciclo ya lleno: abrir siguiente
      if (!pending.includes(cycleNumber)) pending.push(cycleNumber)
      cyclesJustCompleted.push(cycleNumber)
      cycleNumber += 1
      points = 0
      continue
    }
    const add = Math.min(remaining, need)
    points += add
    remaining -= add
    if (points >= target) {
      if (!pending.includes(cycleNumber)) pending.push(cycleNumber)
      cyclesJustCompleted.push(cycleNumber)
      cycleNumber += 1
      points = 0
    }
  }

  const goalJustCompleted = cyclesJustCompleted.length > 0
  const goalStatus: RewardGoalStatus = pending.length > 0 ? 'completed' : 'active'

  next = {
    ...next,
    pointsTotal: points,
    dailyPoints: next.dailyPoints + granted,
    dailyDate: today,
    goalStatus,
    currentCycleNumber: cycleNumber,
    pendingCycleNumbers: pending,
    appliedSessionIds: trimIds([...next.appliedSessionIds, input.sessionId]),
  }

  return {
    reward: next,
    granted,
    requested: input.requestedPoints,
    dailyComplete: next.dailyPoints >= rewardGoalConfig.dailyCap,
    goalJustCompleted,
    cyclesJustCompleted,
    skippedDuplicateSession: false,
  }
}

function trimIds(ids: string[], max = 40): string[] {
  return ids.length <= max ? ids : ids.slice(ids.length - max)
}

/** Marca un premio pendiente como entregado (solo UI local; el servidor es la fuente). */
export function markPrizeDeliveredLocal(
  reward: RewardProgress,
  cycleNumber: number,
): RewardProgress {
  const next = normalizeRewardCycles(reward)
  if (!next.pendingCycleNumbers.includes(cycleNumber)) return next
  return {
    ...next,
    pendingCycleNumbers: next.pendingCycleNumbers.filter((n) => n !== cycleNumber),
    deliveredCycleNumbers: next.deliveredCycleNumbers.includes(cycleNumber)
      ? next.deliveredCycleNumbers
      : [...next.deliveredCycleNumbers, cycleNumber].sort((a, b) => a - b),
    goalStatus:
      next.pendingCycleNumbers.filter((n) => n !== cycleNumber).length > 0
        ? 'completed'
        : 'active',
  }
}

/** Compat: validación adulta antigua → entrega del primer pendiente. */
export function confirmAdultGoal(reward: RewardProgress): RewardProgress {
  const next = normalizeRewardCycles(reward)
  const first = next.pendingCycleNumbers[0]
  if (first == null) return next
  return markPrizeDeliveredLocal(next, first)
}

export function resetRewardGoal(reward: RewardProgress, today: string = localDateString()): RewardProgress {
  return {
    ...createInitialRewardProgress(),
    dailyDate: today,
    deliveredCycleNumbers: normalizeRewardCycles(reward).deliveredCycleNumbers,
    celebratedPendingCycles: normalizeRewardCycles(reward).celebratedPendingCycles,
    appliedSessionIds: reward.appliedSessionIds,
  }
}

export function markPendingCelebrated(reward: RewardProgress, cycleNumber: number): RewardProgress {
  const next = normalizeRewardCycles(reward)
  if (next.celebratedPendingCycles.includes(cycleNumber)) return next
  return {
    ...next,
    celebratedPendingCycles: [...next.celebratedPendingCycles, cycleNumber],
  }
}

export function normalizeRewardCycles(reward: RewardProgress): RewardProgress {
  const currentCycleNumber = Math.max(1, reward.currentCycleNumber ?? 1)
  let pendingCycleNumbers = Array.isArray(reward.pendingCycleNumbers)
    ? [...reward.pendingCycleNumbers]
    : []
  let deliveredCycleNumbers = Array.isArray(reward.deliveredCycleNumbers)
    ? [...reward.deliveredCycleNumbers]
    : []
  const celebratedPendingCycles = Array.isArray(reward.celebratedPendingCycles)
    ? [...reward.celebratedPendingCycles]
    : []

  // Migración desde meta única v1 (completed/validated sin ciclos).
  if (pendingCycleNumbers.length === 0 && reward.goalStatus === 'completed') {
    pendingCycleNumbers = [Math.max(1, currentCycleNumber)]
  }
  if (deliveredCycleNumbers.length === 0 && reward.goalStatus === 'validated') {
    deliveredCycleNumbers = [1]
  }

  return {
    ...reward,
    currentCycleNumber,
    pendingCycleNumbers,
    deliveredCycleNumbers,
    celebratedPendingCycles,
    goalStatus: pendingCycleNumbers.length > 0 ? 'completed' : reward.goalStatus === 'validated' ? 'active' : reward.goalStatus,
  }
}

export function previewSessionLoad(progress: ProgressState, sessionCap: number, today?: string): number {
  const day = today ?? localDateString()
  return maxLoadableForSession(progress.reward, day, sessionCap)
}
