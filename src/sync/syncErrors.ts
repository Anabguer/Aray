import { ApiError } from '@/api/client'

/** Auth temporal: no borrar la cola; se reintenta tras child-enter / CSRF. */
const RETRYABLE_CODES = new Set([
  'unauthorized',
  'device_required',
  'csrf_missing',
  'csrf_invalid',
  'csrf',
])

/** Errores de negocio definitivos: no tiene sentido reintentar el mismo payload. */
const DROP_CODES = new Set([
  'sync_epoch_stale',
  'invalid_grant',
  'session_forbidden',
  'invalid_mode',
  'invalid_session',
])

/** Errores que no se arreglan reintentando: sacar de la cola local. */
export function shouldDropPendingSyncError(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false
  if (DROP_CODES.has(err.code)) return true
  if (err.status === 401 || RETRYABLE_CODES.has(err.code)) return false
  if (err.status === 429 || err.status === 408) return false
  if (err.status >= 500) return false
  // Resto de 4xx (validación, etc.)
  return err.status >= 400 && err.status < 500
}

export const MAX_PENDING_SYNC_ATTEMPTS = 6
