import { ARAY_DATA_EPOCH_FALLBACK, PENDING_SESSIONS_KEY, SYNC_META_KEY } from '@/sync/constants'

export type PendingSessionPayload = {
  sessionId: string
  mode: string
  tables: number[]
  answers: Array<{
    attemptId: string
    a: number
    b: number
    selected: number
    firstTry?: boolean
    attemptN?: number
    elapsedMs?: number
  }>
  clientStartedAt?: string
  /** Época oficial del servidor en el momento de crear la partida. */
  syncEpoch: number
  isMissionOfDay?: boolean
  missionCode?: string
}

export type PendingSessionOp = {
  id: string
  sessionId: string
  epoch: number
  playerId: number
  createdAt: string
  attempts: number
  lastError: string | null
  payload: PendingSessionPayload
}

export type SyncMeta = {
  epoch: number
  playerId: number | null
  lastHydratedAt: string | null
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

export function loadSyncMeta(): SyncMeta {
  const raw = readJson(SYNC_META_KEY)
  if (!raw || typeof raw !== 'object') {
    return { epoch: ARAY_DATA_EPOCH_FALLBACK, playerId: null, lastHydratedAt: null }
  }
  const meta = raw as Partial<SyncMeta>
  return {
    epoch: typeof meta.epoch === 'number' ? meta.epoch : ARAY_DATA_EPOCH_FALLBACK,
    playerId: typeof meta.playerId === 'number' ? meta.playerId : null,
    lastHydratedAt: typeof meta.lastHydratedAt === 'string' ? meta.lastHydratedAt : null,
  }
}

export function saveSyncMeta(meta: SyncMeta): void {
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta))
}

export function currentLocalEpoch(): number {
  return loadSyncMeta().epoch
}

export function loadPendingSessions(): PendingSessionOp[] {
  const raw = readJson(PENDING_SESSIONS_KEY)
  if (!Array.isArray(raw)) return []
  return raw.filter((op): op is PendingSessionOp => {
    return (
      !!op &&
      typeof op === 'object' &&
      typeof (op as PendingSessionOp).sessionId === 'string' &&
      typeof (op as PendingSessionOp).epoch === 'number' &&
      typeof (op as PendingSessionOp).playerId === 'number' &&
      !!(op as PendingSessionOp).payload &&
      typeof (op as PendingSessionOp).payload === 'object'
    )
  })
}

export function savePendingSessions(ops: PendingSessionOp[]): void {
  localStorage.setItem(PENDING_SESSIONS_KEY, JSON.stringify(ops))
}

/**
 * Descarta cola de epochs anteriores al oficial del servidor.
 * Conserva partidas pendientes de OTROS niños en la misma época
 * (cambiar de perfil no debe borrar la cola del hermano).
 */
export function purgeStaleLocalSync(
  serverEpoch: number,
  currentPlayerId: number | null = null,
): {
  purgedOps: number
  epochChanged: boolean
} {
  const meta = loadSyncMeta()
  const epochChanged = meta.epoch !== serverEpoch
  const ops = loadPendingSessions()
  const kept = ops.filter(
    (op) => op.epoch === serverEpoch && op.payload.syncEpoch === serverEpoch,
  )
  const purgedOps = ops.length - kept.length
  if (purgedOps > 0 || epochChanged) {
    savePendingSessions(kept)
  }
  if (epochChanged || meta.playerId !== currentPlayerId) {
    saveSyncMeta({
      epoch: serverEpoch,
      playerId: currentPlayerId,
      lastHydratedAt: epochChanged ? null : meta.lastHydratedAt,
    })
  }
  return { purgedOps, epochChanged }
}

export function enqueuePendingSession(
  op: Omit<PendingSessionOp, 'id' | 'attempts' | 'lastError'>,
): PendingSessionOp {
  const ops = loadPendingSessions()
  const existing = ops.find((o) => o.sessionId === op.sessionId && o.epoch === op.epoch)
  if (existing) return existing

  const next: PendingSessionOp = {
    ...op,
    id: `pending_${op.sessionId}`,
    attempts: 0,
    lastError: null,
  }
  ops.push(next)
  savePendingSessions(ops)
  return next
}

export function markPendingAttempt(sessionId: string, error: string | null): void {
  const ops = loadPendingSessions()
  const idx = ops.findIndex((o) => o.sessionId === sessionId)
  if (idx < 0) return
  ops[idx] = {
    ...ops[idx],
    attempts: ops[idx].attempts + 1,
    lastError: error,
  }
  savePendingSessions(ops)
}

/** Solo tras confirmación del servidor. */
export function removePendingSession(sessionId: string): void {
  savePendingSessions(loadPendingSessions().filter((o) => o.sessionId !== sessionId))
}

export function pendingCount(serverEpoch?: number, playerId?: number | null): number {
  const epoch = serverEpoch ?? currentLocalEpoch()
  return loadPendingSessions().filter(
    (o) => o.epoch === epoch && (playerId == null || o.playerId === playerId),
  ).length
}

/** Vacía progreso en caché cuando cambia la época oficial. */
export function clearProgressCache(progressKey: string): void {
  try {
    localStorage.removeItem(progressKey)
  } catch {
    /* ignore */
  }
}
