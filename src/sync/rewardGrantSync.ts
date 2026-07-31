import { ApiError, apiPost } from '@/api/client'
import type { RewardProgress } from '@/math/types'
import {
  createInitialRewardProgress,
  localDateString,
  normalizeRewardCycles,
  syncRewardDay,
} from '@/reward/engine'
import { ensureChildPlaySession } from '@/sync/playSession'
import { currentLocalEpoch, purgeStaleLocalSync } from '@/sync/pendingQueue'

const PENDING_KEY = 'aray.pending.rewardGrant.v1'

export type ActivityEnergyGrant = {
  sessionId: string
  requestedPoints: number
  mode: string
  correct?: number
  wrong?: number
}

type ServerReward = {
  pointsTotal?: number
  dailyDate?: string | null
  dailyPoints?: number
  goalStatus?: string
  currentCycleNumber?: number
  pendingPrize?: { cycleNumber?: number } | null
  deliveredPrizes?: Array<{ cycleNumber?: number }>
}

type GrantResponse = {
  granted?: number
  skippedDuplicate?: boolean
  reward?: ServerReward
}

type PendingOp = {
  sessionId: string
  playerId: number
  epoch: number
  createdAt: string
  grant: ActivityEnergyGrant
}

function readPending(): PendingOp[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as PendingOp[]) : []
  } catch {
    return []
  }
}

function writePending(ops: PendingOp[]): void {
  localStorage.setItem(PENDING_KEY, JSON.stringify(ops))
}

export function rewardGrantPendingCount(serverEpoch?: number): number {
  const epoch = serverEpoch ?? currentLocalEpoch()
  return readPending().filter((o) => o.epoch === epoch).length
}

export function purgeStaleRewardGrantPending(
  serverEpoch: number,
  currentPlayerId: number | null = null,
): number {
  const before = readPending()
  const kept = before.filter(
    (o) => o.epoch === serverEpoch && (currentPlayerId === null || o.playerId === currentPlayerId),
  )
  const purged = before.length - kept.length
  if (purged > 0) writePending(kept)
  return purged
}

export function mapGrantReward(server: ServerReward | undefined, local: RewardProgress): RewardProgress {
  const today = localDateString()
  if (!server) return local

  const pendingCycleNumbers: number[] = []
  if (server.pendingPrize && typeof server.pendingPrize.cycleNumber === 'number') {
    pendingCycleNumbers.push(server.pendingPrize.cycleNumber)
  }
  const deliveredCycleNumbers = Array.isArray(server.deliveredPrizes)
    ? server.deliveredPrizes
        .map((p) => p.cycleNumber)
        .filter((n): n is number => typeof n === 'number')
    : []
  const goalStatus =
    server.goalStatus === 'completed' || server.goalStatus === 'validated' || server.goalStatus === 'active'
      ? server.goalStatus
      : pendingCycleNumbers.length > 0
        ? 'completed'
        : 'active'

  return normalizeRewardCycles(
    syncRewardDay(
      {
        ...createInitialRewardProgress(),
        pointsTotal: typeof server.pointsTotal === 'number' ? server.pointsTotal : 0,
        dailyDate: typeof server.dailyDate === 'string' ? server.dailyDate : today,
        dailyPoints: typeof server.dailyPoints === 'number' ? server.dailyPoints : 0,
        goalStatus,
        currentCycleNumber:
          typeof server.currentCycleNumber === 'number'
            ? server.currentCycleNumber
            : local.currentCycleNumber,
        pendingCycleNumbers,
        deliveredCycleNumbers,
        celebratedPendingCycles: local.celebratedPendingCycles.filter((n) =>
          pendingCycleNumbers.includes(n),
        ),
        appliedSessionIds: local.appliedSessionIds,
      },
      today,
    ),
  )
}

async function submitGrant(grant: ActivityEnergyGrant, appliedSessionIds: string[]): Promise<GrantResponse> {
  await ensureChildPlaySession()
  return apiPost<GrantResponse>('/players/reward-grant.php', {
    sessionId: grant.sessionId,
    requestedPoints: grant.requestedPoints,
    appliedSessionIds,
    activity: {
      mode: grant.mode,
      correct: grant.correct ?? 0,
      wrong: grant.wrong ?? 0,
      rewardPoints: grant.requestedPoints,
    },
  })
}

export async function enqueueAndSyncRewardGrant(args: {
  playerId: number
  grant: ActivityEnergyGrant
  appliedSessionIds: string[]
  localReward: RewardProgress
}): Promise<{
  synced: boolean
  reward: RewardProgress | null
  granted: number
  error: string | null
}> {
  const epoch = currentLocalEpoch()
  purgeStaleLocalSync(epoch, args.playerId)
  purgeStaleRewardGrantPending(epoch, args.playerId)

  const ops = readPending().filter((o) => o.sessionId !== args.grant.sessionId)
  ops.push({
    sessionId: args.grant.sessionId,
    playerId: args.playerId,
    epoch,
    createdAt: new Date().toISOString(),
    grant: args.grant,
  })
  writePending(ops.slice(-40))

  try {
    const res = await submitGrant(args.grant, args.appliedSessionIds)
    writePending(readPending().filter((o) => o.sessionId !== args.grant.sessionId))
    const withApplied = {
      ...args.localReward,
      appliedSessionIds: args.localReward.appliedSessionIds.includes(args.grant.sessionId)
        ? args.localReward.appliedSessionIds
        : [...args.localReward.appliedSessionIds, args.grant.sessionId],
    }
    return {
      synced: true,
      reward: mapGrantReward(res.reward, withApplied),
      granted: typeof res.granted === 'number' ? res.granted : 0,
      error: null,
    }
  } catch (e) {
    const msg =
      e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'No se pudo sincronizar energía'
    return { synced: false, reward: null, granted: 0, error: msg }
  }
}

export async function flushPendingRewardGrants(
  playerId: number,
  appliedSessionIds: string[],
  localReward: RewardProgress,
): Promise<{ reward: RewardProgress | null; error: string | null }> {
  const epoch = currentLocalEpoch()
  purgeStaleRewardGrantPending(epoch, playerId)
  const pending = readPending().filter((o) => o.playerId === playerId && o.epoch === epoch)
  let latest: RewardProgress | null = null
  let lastError: string | null = null
  for (const op of pending) {
    try {
      const res = await submitGrant(op.grant, appliedSessionIds)
      writePending(readPending().filter((o) => o.sessionId !== op.sessionId))
      latest = mapGrantReward(res.reward, latest ?? localReward)
    } catch (e) {
      lastError =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Cola de energía pendiente'
      break
    }
  }
  return { reward: latest, error: lastError }
}
