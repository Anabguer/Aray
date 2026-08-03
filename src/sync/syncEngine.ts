import { ApiError, apiGet, apiPost } from '@/api/client'
import type { ProgressState, SessionAnswer, SessionResult } from '@/math/types'
import { ARAY_DATA_EPOCH_FALLBACK, PROGRESS_CACHE_KEY } from '@/sync/constants'
import { mapServerProgressToState, type ServerProgressSnapshot } from '@/sync/mapServerProgress'
import { applyServerDailyMission } from '@/sync/dailyMissionSync'
import {
  clearProgressCache,
  currentLocalEpoch,
  enqueuePendingSession,
  loadPendingSessions,
  markPendingAttempt,
  purgeStaleLocalSync,
  removePendingSession,
  saveSyncMeta,
  type PendingSessionPayload,
} from '@/sync/pendingQueue'
import { ensureChildPlaySession, fetchAuthMe, resolvePlayerId, resolvePlayerSlug } from '@/sync/playSession'
import { MAX_PENDING_SYNC_ATTEMPTS, shouldDropPendingSyncError } from '@/sync/syncErrors'

export type SyncStatus =
  | 'idle'
  | 'hydrating'
  | 'ready'
  | 'syncing'
  | 'offline'
  | 'needs_device'
  | 'error'

type ProgressResponse = {
  progress?: ServerProgressSnapshot
  csrf?: string
}

type SessionSubmitResponse = {
  idempotent?: boolean
  sessionId?: string
  score?: number
  bestStreak?: number
  xpEarned?: number
  coinsEarned?: number
  progress?: ServerProgressSnapshot
  csrf?: string
  error?: string
}

function toSubmitAnswers(answers: SessionAnswer[]): PendingSessionPayload['answers'] {
  return answers.map((a, index) => ({
    attemptId: a.attemptId,
    a: a.fact.a,
    b: a.fact.b,
    selected: a.selected,
    firstTry: a.firstTry !== false,
    attemptN: index + 1,
    elapsedMs: a.elapsedMs,
  }))
}

export function buildSessionPayload(partial: {
  sessionId: string
  mode: SessionResult['mode'] | string
  tables: number[]
  answers: SessionAnswer[]
  clientStartedAt?: string
  syncEpoch: number
  isMissionOfDay?: boolean
  missionCode?: string
}): PendingSessionPayload {
  return {
    sessionId: partial.sessionId,
    mode: partial.mode,
    tables: partial.tables,
    answers: toSubmitAnswers(partial.answers),
    clientStartedAt: partial.clientStartedAt,
    syncEpoch: partial.syncEpoch,
    ...(partial.isMissionOfDay ? { isMissionOfDay: true } : {}),
    ...(partial.missionCode ? { missionCode: partial.missionCode } : {}),
  }
}

function readSyncEpoch(snapshot: ServerProgressSnapshot): number {
  if (typeof snapshot.syncEpoch === 'number' && snapshot.syncEpoch >= 1) {
    return snapshot.syncEpoch
  }
  return ARAY_DATA_EPOCH_FALLBACK
}

export async function fetchOfficialProgress(playerId: number): Promise<ServerProgressSnapshot> {
  const data = await apiGet<ProgressResponse>(`/players/progress.php?playerId=${playerId}`)
  if (!data.progress || typeof data.progress !== 'object') {
    throw new ApiError(500, 'progress_missing', 'El servidor no devolvió progreso.')
  }
  return data.progress
}

export async function hydrateOfficialProgress(opts: {
  soundMuted?: boolean
  achievements?: ProgressState['achievements']
  celebratedPendingCycles?: number[]
}): Promise<{
  status: SyncStatus
  playerId: number | null
  progress: ProgressState | null
  syncEpoch: number
  error: string | null
}> {
  try {
    const me = await fetchAuthMe()
    let playerId = resolvePlayerId(me)
    const preferredSlug = resolvePlayerSlug(me)

    // No forzar child-enter si hay sesión adulta (panel familiar).
    // En el lobby/juego, AuthGate entra como niño cuando hace falta.
    if (me.role !== 'adult') {
      const child = await ensureChildPlaySession({
        playerSlug: preferredSlug,
        playerId,
      })
      if (child) playerId = child.id
    }

    if (!playerId) {
      purgeStaleLocalSync(ARAY_DATA_EPOCH_FALLBACK, null)
      clearProgressCache(PROGRESS_CACHE_KEY)
      return {
        status: 'needs_device',
        playerId: null,
        progress: null,
        syncEpoch: ARAY_DATA_EPOCH_FALLBACK,
        error: null,
      }
    }

    const snapshot = await fetchOfficialProgress(playerId)
    const syncEpoch = readSyncEpoch(snapshot)
    const purged = purgeStaleLocalSync(syncEpoch, playerId)
    if (purged.epochChanged) {
      clearProgressCache(PROGRESS_CACHE_KEY)
    }

    const progress = mapServerProgressToState(snapshot, opts)
    applyServerDailyMission(playerId, snapshot.dailyMission)
    saveSyncMeta({
      epoch: syncEpoch,
      playerId,
      lastHydratedAt: new Date().toISOString(),
    })

    return { status: 'ready', playerId, progress, syncEpoch, error: null }
  } catch (err) {
    if (
      err instanceof ApiError &&
      (err.status === 401 || err.code === 'unauthorized' || err.code === 'device_required')
    ) {
      return {
        status: 'needs_device',
        playerId: null,
        progress: null,
        syncEpoch: currentLocalEpoch(),
        error: null,
      }
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        status: 'offline',
        playerId: null,
        progress: null,
        syncEpoch: currentLocalEpoch(),
        error: 'Sin conexión.',
      }
    }
    const message = err instanceof Error ? err.message : 'No se pudo cargar el progreso.'
    return {
      status: 'error',
      playerId: null,
      progress: null,
      syncEpoch: currentLocalEpoch(),
      error: message,
    }
  }
}

export async function submitSessionToServer(
  payload: PendingSessionPayload,
  opts?: { playerSlug?: string | null; playerId?: number | null },
): Promise<SessionSubmitResponse> {
  const child = await ensureChildPlaySession({
    playerSlug: opts?.playerSlug,
    playerId: opts?.playerId,
  })
  if (!child) {
    throw new ApiError(401, 'device_required', 'Se requiere sesión infantil para guardar la partida.')
  }
  return apiPost<SessionSubmitResponse>('/players/session-submit.php', {
    sessionId: payload.sessionId,
    mode: payload.mode,
    tables: payload.tables,
    answers: payload.answers,
    clientStartedAt: payload.clientStartedAt,
    syncEpoch: payload.syncEpoch,
    ...(payload.isMissionOfDay ? { isMissionOfDay: true } : {}),
    ...(payload.missionCode ? { missionCode: payload.missionCode } : {}),
  })
}

/**
 * Encola la partida y intenta sincronizar.
 * Solo elimina de la cola si el servidor confirma (200, incl. idempotente).
 * 409 sync_epoch_stale → descarta esa operación (corte de datos).
 */
export async function enqueueAndSyncSession(args: {
  playerId: number
  playerSlug?: string | null
  payload: PendingSessionPayload
}): Promise<{
  synced: boolean
  progress: ProgressState | null
  server: SessionSubmitResponse | null
  error: string | null
}> {
  const epoch = args.payload.syncEpoch
  purgeStaleLocalSync(epoch, args.playerId)
  enqueuePendingSession({
    sessionId: args.payload.sessionId,
    epoch,
    playerId: args.playerId,
    createdAt: new Date().toISOString(),
    payload: args.payload,
  })

  return flushPendingSessions(args.playerId, args.payload.sessionId, args.playerSlug)
}

export async function flushPendingSessions(
  playerId: number,
  preferSessionId?: string,
  playerSlug?: string | null,
): Promise<{
  synced: boolean
  progress: ProgressState | null
  server: SessionSubmitResponse | null
  error: string | null
}> {
  const epoch = currentLocalEpoch()
  purgeStaleLocalSync(epoch, playerId)
  let ops = loadPendingSessions().filter((o) => o.epoch === epoch && o.playerId === playerId)
  if (ops.length === 0) {
    return { synced: true, progress: null, server: null, error: null }
  }

  if (preferSessionId) {
    ops = [
      ...ops.filter((o) => o.sessionId === preferSessionId),
      ...ops.filter((o) => o.sessionId !== preferSessionId),
    ]
  }

  let lastServer: SessionSubmitResponse | null = null
  let lastProgress: ProgressState | null = null
  let lastError: string | null = null
  let anySynced = false

  try {
    const child = await ensureChildPlaySession({ playerId, playerSlug })
    if (!child) {
      // Adulto u otro caso sin child: no ensuciar la UI con el mensaje de la API.
      // La cola se mantiene y se reintenta cuando haya sesión infantil.
      return {
        synced: false,
        progress: null,
        server: null,
        error: null,
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sin sesión de juego.'
    return { synced: false, progress: null, server: null, error: message }
  }

  for (const op of ops) {
    try {
      const server = await submitSessionToServer(op.payload, { playerId, playerSlug })
      removePendingSession(op.sessionId)
      anySynced = true
      lastServer = server
      if (server.progress) {
        const serverEpoch = readSyncEpoch(server.progress)
        purgeStaleLocalSync(serverEpoch, playerId)
        lastProgress = mapServerProgressToState(server.progress)
        applyServerDailyMission(playerId, server.progress.dailyMission)
        saveSyncMeta({
          epoch: serverEpoch,
          playerId,
          lastHydratedAt: new Date().toISOString(),
        })
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'sync_epoch_stale') {
        removePendingSession(op.sessionId)
        clearProgressCache(PROGRESS_CACHE_KEY)
        lastError = err.message
        continue
      }
      const message = err instanceof Error ? err.message : 'Error de sincronización'
      markPendingAttempt(op.sessionId, message)
      const attempts =
        loadPendingSessions().find((o) => o.sessionId === op.sessionId)?.attempts ?? 0
      if (shouldDropPendingSyncError(err) || attempts >= MAX_PENDING_SYNC_ATTEMPTS) {
        removePendingSession(op.sessionId)
        lastError = message
        continue
      }
      lastError = message
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        break
      }
    }
  }

  if (!lastProgress && anySynced) {
    try {
      const snapshot = await fetchOfficialProgress(playerId)
      const serverEpoch = readSyncEpoch(snapshot)
      purgeStaleLocalSync(serverEpoch, playerId)
      lastProgress = mapServerProgressToState(snapshot)
      applyServerDailyMission(playerId, snapshot.dailyMission)
    } catch {
      /* snapshot opcional tras sync parcial */
    }
  }

  return {
    synced: anySynced && loadPendingSessions().filter((o) => o.playerId === playerId).length === 0,
    progress: lastProgress,
    server: lastServer,
    error: lastError,
  }
}
