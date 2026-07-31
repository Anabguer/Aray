import { ApiError } from '@/api/client'

/** Errores que no se arreglan reintentando: sacar de la cola local. */
export function shouldDropPendingSyncError(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false
  if (err.code === 'sync_epoch_stale') return true
  if (err.status === 429 || err.status === 408) return false
  if (err.status >= 500) return false
  // 4xx: invalid_mode, forbidden, unauthorized, session_forbidden, etc.
  return err.status >= 400 && err.status < 500
}

export const MAX_PENDING_SYNC_ATTEMPTS = 6
