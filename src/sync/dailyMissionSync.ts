import { apiPost } from '@/api/client'
import {
  loadDailyMissionSnapshot,
  mergeDailyMissionSnapshots,
  normalizeDailyMissionSnapshot,
  saveDailyMissionSnapshot,
  type DailyMissionSnapshot,
} from '@/daily/missionEnergy'
import { localDateString } from '@/reward/engine'
import { ensureChildPlaySession } from '@/sync/playSession'
import { currentLocalEpoch, purgeStaleLocalSync } from '@/sync/pendingQueue'
import { MAX_PENDING_SYNC_ATTEMPTS, shouldDropPendingSyncError } from '@/sync/syncErrors'

const PENDING_KEY = 'aray.pending.dailyMission.v1'

type PendingOp = {
  playerId: number
  epoch: number
  createdAt: string
  attempts?: number
  lastError?: string | null
  snapshot: DailyMissionSnapshot
}

type SyncResponse = {
  dailyMission?: DailyMissionSnapshot
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

/** Aplica snapshot del servidor (merge monótono con local) y notifica la UI. */
export function applyServerDailyMission(
  playerId: number | null,
  server: unknown,
): DailyMissionSnapshot {
  const today = localDateString()
  const local = loadDailyMissionSnapshot(playerId, today)
  const remote = normalizeDailyMissionSnapshot(server, today)
  const merged = mergeDailyMissionSnapshots(local, remote, today)
  saveDailyMissionSnapshot(merged, playerId)
  return merged
}

async function postDailyMission(
  snapshot: DailyMissionSnapshot,
  opts: { playerId: number; playerSlug?: string | null },
): Promise<DailyMissionSnapshot> {
  const child = await ensureChildPlaySession({
    playerSlug: opts.playerSlug,
    playerId: opts.playerId,
  })
  if (!child) {
    throw new Error('device_required')
  }
  const data = await apiPost<SyncResponse>('/players/daily-mission.php', {
    date: snapshot.date,
    progress: snapshot.progress,
    challengeDone: snapshot.challengeDone,
  })
  const today = localDateString()
  return mergeDailyMissionSnapshots(
    snapshot,
    normalizeDailyMissionSnapshot(data.dailyMission, today),
    today,
  )
}

/** Encola y sincroniza el snapshot local de misión diaria. */
export async function enqueueAndSyncDailyMission(opts: {
  playerId: number
  playerSlug?: string | null
  snapshot: DailyMissionSnapshot
}): Promise<{ snapshot: DailyMissionSnapshot; error: string | null }> {
  const epoch = currentLocalEpoch()
  const others = readPending().filter(
    (o) => !(o.playerId === opts.playerId && o.epoch === epoch),
  )
  others.push({
    playerId: opts.playerId,
    epoch,
    createdAt: new Date().toISOString(),
    snapshot: opts.snapshot,
  })
  writePending(others)

  return flushDailyMissionPending({
    playerId: opts.playerId,
    playerSlug: opts.playerSlug,
  })
}

export async function flushDailyMissionPending(opts: {
  playerId: number
  playerSlug?: string | null
}): Promise<{ snapshot: DailyMissionSnapshot; error: string | null }> {
  const epoch = currentLocalEpoch()
  purgeStaleLocalSync(epoch, opts.playerId)
  const ops = readPending().filter((o) => o.playerId === opts.playerId && o.epoch === epoch)
  if (ops.length === 0) {
    return { snapshot: loadDailyMissionSnapshot(opts.playerId), error: null }
  }

  const latest = ops[ops.length - 1]!
  try {
    const merged = await postDailyMission(latest.snapshot, opts)
    saveDailyMissionSnapshot(merged, opts.playerId)
    writePending(
      readPending().filter((o) => !(o.playerId === opts.playerId && o.epoch === epoch)),
    )
    return { snapshot: merged, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'sync_failed'
    const attempts = (latest.attempts ?? 0) + 1
    const drop = shouldDropPendingSyncError(err) || attempts >= MAX_PENDING_SYNC_ATTEMPTS
    const rest = readPending().filter(
      (o) => !(o.playerId === opts.playerId && o.epoch === epoch),
    )
    if (!drop) {
      rest.push({ ...latest, attempts, lastError: message })
    }
    writePending(rest)
    return { snapshot: loadDailyMissionSnapshot(opts.playerId), error: message }
  }
}
