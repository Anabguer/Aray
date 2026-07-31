import { ApiError, apiPost } from '@/api/client'
import type { AlphabetAnswerRecord } from '@/alphabet/progress'
import type { AlphabetPlayMode } from '@/alphabet/types'
import type { ProgressState } from '@/math/types'
import { ARAY_DATA_EPOCH_FALLBACK, PROGRESS_CACHE_KEY } from '@/sync/constants'
import { mapServerProgressToState, type ServerProgressSnapshot } from '@/sync/mapServerProgress'
import {
  clearProgressCache,
  currentLocalEpoch,
  purgeStaleLocalSync,
  saveSyncMeta,
} from '@/sync/pendingQueue'
import { ensureChildPlaySession } from '@/sync/playSession'

const PENDING_ABC_KEY = 'aray.pending.alphabet.v1'

export type AlphabetSessionPayload = {
  sessionId: string
  mode: AlphabetPlayMode
  answers: AlphabetAnswerRecord[]
  bestStreakInRound: number
  syncEpoch: number
}

type AlphabetSubmitResponse = {
  idempotent?: boolean
  sessionId?: string
  score?: number
  bestStreak?: number
  xpEarned?: number
  coinsEarned?: number
  energyGranted?: number
  progress?: ServerProgressSnapshot
  csrf?: string
  error?: string
}

type PendingAbcOp = {
  sessionId: string
  playerId: number
  epoch: number
  createdAt: string
  payload: AlphabetSessionPayload
}

function readPending(): PendingAbcOp[] {
  try {
    const raw = localStorage.getItem(PENDING_ABC_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as PendingAbcOp[]) : []
  } catch {
    return []
  }
}

function writePending(ops: PendingAbcOp[]): void {
  localStorage.setItem(PENDING_ABC_KEY, JSON.stringify(ops))
}

/** Descarta cola ABC de epochs/jugadores anteriores. */
export function purgeStaleAlphabetPending(
  serverEpoch: number,
  currentPlayerId: number | null = null,
): number {
  const before = readPending()
  const kept = before.filter(
    (o) =>
      o.epoch === serverEpoch &&
      (currentPlayerId === null || o.playerId === currentPlayerId) &&
      o.payload.syncEpoch === serverEpoch,
  )
  const purged = before.length - kept.length
  if (purged > 0) writePending(kept)
  return purged
}

export function alphabetPendingCount(serverEpoch?: number): number {
  const epoch = serverEpoch ?? currentLocalEpoch()
  return readPending().filter((o) => o.epoch === epoch).length
}

export function enqueueAlphabetSession(args: {
  playerId: number
  payload: AlphabetSessionPayload
}): void {
  const ops = readPending().filter((o) => o.sessionId !== args.payload.sessionId)
  ops.push({
    sessionId: args.payload.sessionId,
    playerId: args.playerId,
    epoch: args.payload.syncEpoch,
    createdAt: new Date().toISOString(),
    payload: args.payload,
  })
  writePending(ops.slice(-40))
}

async function submitAlphabetToServer(
  payload: AlphabetSessionPayload,
): Promise<AlphabetSubmitResponse> {
  return apiPost<AlphabetSubmitResponse>('/players/alphabet-session-submit.php', {
    sessionId: payload.sessionId,
    mode: payload.mode,
    answers: payload.answers.map((a) => ({
      attemptId: a.attemptId,
      kind: a.kind,
      correct: a.correct,
      firstTry: a.firstTry,
      focusLetter: a.focusLetter ?? '',
    })),
    bestStreakInRound: payload.bestStreakInRound,
    syncEpoch: payload.syncEpoch,
  })
}

export async function enqueueAndSyncAlphabetSession(args: {
  playerId: number
  payload: AlphabetSessionPayload
}): Promise<{
  synced: boolean
  progress: ProgressState | null
  error: string | null
}> {
  const epoch = args.payload.syncEpoch
  purgeStaleLocalSync(epoch, args.playerId)
  enqueueAlphabetSession(args)
  return flushPendingAlphabetSessions(args.playerId, args.payload.sessionId)
}

export async function flushPendingAlphabetSessions(
  playerId: number,
  preferSessionId?: string,
): Promise<{
  synced: boolean
  progress: ProgressState | null
  error: string | null
}> {
  const epoch = currentLocalEpoch()
  purgeStaleLocalSync(epoch, playerId)
  purgeStaleAlphabetPending(epoch, playerId)
  let ops = readPending().filter((o) => o.epoch === epoch && o.playerId === playerId)
  if (ops.length === 0) {
    return { synced: true, progress: null, error: null }
  }
  if (preferSessionId) {
    ops = [
      ...ops.filter((o) => o.sessionId === preferSessionId),
      ...ops.filter((o) => o.sessionId !== preferSessionId),
    ]
  }

  try {
    await ensureChildPlaySession()
  } catch (err) {
    return {
      synced: false,
      progress: null,
      error: err instanceof Error ? err.message : 'Sin sesión de juego.',
    }
  }

  let lastProgress: ProgressState | null = null
  let lastError: string | null = null
  let anySynced = false

  for (const op of ops) {
    try {
      const server = await submitAlphabetToServer(op.payload)
      writePending(readPending().filter((o) => o.sessionId !== op.sessionId))
      anySynced = true
      if (server.progress) {
        const serverEpoch =
          typeof server.progress.syncEpoch === 'number' && server.progress.syncEpoch >= 1
            ? server.progress.syncEpoch
            : ARAY_DATA_EPOCH_FALLBACK
        purgeStaleLocalSync(serverEpoch, playerId)
        lastProgress = mapServerProgressToState(server.progress)
        saveSyncMeta({
          epoch: serverEpoch,
          playerId,
          lastHydratedAt: new Date().toISOString(),
        })
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'sync_epoch_stale') {
        writePending(readPending().filter((o) => o.sessionId !== op.sessionId))
        clearProgressCache(PROGRESS_CACHE_KEY)
        lastError = err.message
        continue
      }
      lastError = err instanceof Error ? err.message : 'Error sync ABC'
      if (typeof navigator !== 'undefined' && !navigator.onLine) break
    }
  }

  return { synced: anySynced, progress: lastProgress, error: lastError }
}
