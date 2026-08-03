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
import { MAX_PENDING_SYNC_ATTEMPTS, shouldDropPendingSyncError } from '@/sync/syncErrors'

const PENDING_KEY = 'aray.pending.rewardGrant.v1'

export type ActivityEnergyGrant = {
  sessionId: string
  requestedPoints: number
  mode: string
  correct?: number
  wrong?: number
  /** XP de juego a sumar en local (economía: XP solo al jugar). */
  xpEarned?: number
  /** Delta de stats de logros (tiempo, feature, racha buena…). */
  statsDelta?: import('@/achievements/stats').StatsDelta
  /** Cajas / logros / level-up: no consumen cupo de misión del día. */
  ignoreDailyCap?: boolean
  /** Completó el Reto del día (card JUGAR del lobby): +challengeDaily una vez. */
  claimDailyChallenge?: boolean
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
  achievements?: { claimedIds?: string[] }
  stats?: unknown
}

type PendingOp = {
  sessionId: string
  playerId: number
  epoch: number
  createdAt: string
  attempts?: number
  lastError?: string | null
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

export function rewardGrantPendingCount(serverEpoch?: number, playerId?: number | null): number {
  const epoch = serverEpoch ?? currentLocalEpoch()
  return readPending().filter(
    (o) => o.epoch === epoch && (playerId == null || o.playerId === playerId),
  ).length
}

export function purgeStaleRewardGrantPending(
  serverEpoch: number,
  _currentPlayerId: number | null = null,
): number {
  const before = readPending()
  const kept = before.filter((o) => o.epoch === serverEpoch)
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

async function submitGrant(
  grant: ActivityEnergyGrant,
  appliedSessionIds: string[],
  opts?: { playerSlug?: string | null; playerId?: number | null },
): Promise<GrantResponse> {
  const child = await ensureChildPlaySession({
    playerSlug: opts?.playerSlug,
    playerId: opts?.playerId,
  })
  if (!child) {
    throw new ApiError(401, 'device_required', 'Se requiere sesión infantil para guardar la energía.')
  }
  // No enviar el sessionId actual como "ya aplicado": el motor local lo añade
  // antes del POST y el servidor lo interpretaba como duplicado (0 energía).
  const priorOnly = appliedSessionIds.filter((id) => id !== grant.sessionId)
  return apiPost<GrantResponse>('/players/reward-grant.php', {
    sessionId: grant.sessionId,
    requestedPoints: grant.requestedPoints,
    appliedSessionIds: priorOnly,
    ...(grant.ignoreDailyCap ? { ignoreDailyCap: true } : {}),
    ...(typeof grant.xpEarned === 'number' && grant.xpEarned > 0
      ? { xpEarned: Math.max(0, Math.floor(grant.xpEarned)) }
      : {}),
    activity: {
      mode: grant.mode,
      correct: grant.correct ?? 0,
      wrong: grant.wrong ?? 0,
      rewardPoints: grant.requestedPoints,
    },
    ...(grant.statsDelta ? { statsDelta: grant.statsDelta } : {}),
  })
}

/** Energía por subir de nivel: stub mode=levelup, idempotente por sessionId. */
export async function syncLevelUpEnergyEvents(args: {
  playerId: number
  playerSlug?: string | null
  playerKey: string
  events: Array<{ newLevel: number; energyRequested: number }>
  appliedSessionIds: string[]
  localReward: RewardProgress
}): Promise<{ reward: RewardProgress | null; error: string | null }> {
  if (args.events.length === 0) {
    return { reward: null, error: null }
  }
  let reward = args.localReward
  let applied = [...args.appliedSessionIds]
  let lastError: string | null = null
  for (const ev of args.events) {
    const sessionId = `levelup-${args.playerKey}-${ev.newLevel}`.slice(0, 64)
    const result = await enqueueAndSyncRewardGrant({
      playerId: args.playerId,
      playerSlug: args.playerSlug,
      grant: {
        sessionId,
        requestedPoints: Math.max(0, ev.energyRequested),
        mode: 'levelup',
        ignoreDailyCap: true,
      },
      appliedSessionIds: applied,
      localReward: reward,
    })
    if (result.reward) {
      reward = {
        ...result.reward,
        appliedSessionIds: Array.from(
          new Set([...reward.appliedSessionIds, ...result.reward.appliedSessionIds, sessionId]),
        ),
      }
      applied = reward.appliedSessionIds
    }
    if (result.error) lastError = result.error
  }
  return { reward, error: lastError }
}

export async function enqueueAndSyncRewardGrant(args: {
  playerId: number
  playerSlug?: string | null
  grant: ActivityEnergyGrant
  appliedSessionIds: string[]
  localReward: RewardProgress
}): Promise<{
  synced: boolean
  reward: RewardProgress | null
  granted: number
  error: string | null
  achievementsClaimedIds: string[] | null
  stats: unknown | null
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
    attempts: 0,
    lastError: null,
    grant: args.grant,
  })
  writePending(ops.slice(-40))

  try {
    const res = await submitGrant(args.grant, args.appliedSessionIds, {
      playerId: args.playerId,
      playerSlug: args.playerSlug,
    })
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
      achievementsClaimedIds: Array.isArray(res.achievements?.claimedIds)
        ? res.achievements!.claimedIds.filter((id): id is string => typeof id === 'string')
        : null,
      stats: res.stats ?? null,
    }
  } catch (e) {
    const msg =
      e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'No se pudo sincronizar energía'
    if (shouldDropPendingSyncError(e)) {
      writePending(readPending().filter((o) => o.sessionId !== args.grant.sessionId))
    } else {
      writePending(
        readPending().map((o) =>
          o.sessionId === args.grant.sessionId
            ? { ...o, attempts: (o.attempts ?? 0) + 1, lastError: msg }
            : o,
        ),
      )
    }
    return {
      synced: false,
      reward: null,
      granted: 0,
      error: msg,
      achievementsClaimedIds: null,
      stats: null,
    }
  }
}

export async function flushPendingRewardGrants(
  playerId: number,
  appliedSessionIds: string[],
  localReward: RewardProgress,
  playerSlug?: string | null,
): Promise<{ reward: RewardProgress | null; error: string | null }> {
  const epoch = currentLocalEpoch()
  purgeStaleRewardGrantPending(epoch, playerId)
  const pending = readPending().filter((o) => o.playerId === playerId && o.epoch === epoch)
  let latest: RewardProgress | null = null
  let lastError: string | null = null
  for (const op of pending) {
    try {
      const res = await submitGrant(op.grant, appliedSessionIds, { playerId, playerSlug })
      writePending(readPending().filter((o) => o.sessionId !== op.sessionId))
      latest = mapGrantReward(res.reward, latest ?? localReward)
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Cola de energía pendiente'
      const attempts = (op.attempts ?? 0) + 1
      if (shouldDropPendingSyncError(e) || attempts >= MAX_PENDING_SYNC_ATTEMPTS) {
        writePending(readPending().filter((o) => o.sessionId !== op.sessionId))
        lastError = msg
        continue
      }
      writePending(
        readPending().map((o) =>
          o.sessionId === op.sessionId ? { ...o, attempts, lastError: msg } : o,
        ),
      )
      lastError = msg
      break
    }
  }
  return { reward: latest, error: lastError }
}
