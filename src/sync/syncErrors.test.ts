import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api/client'
import { shouldDropPendingSyncError } from '@/sync/syncErrors'

describe('shouldDropPendingSyncError', () => {
  it('no tira grants por 401 / device_required (se reintentan)', () => {
    expect(shouldDropPendingSyncError(new ApiError(401, 'unauthorized', 'no'))).toBe(false)
    expect(shouldDropPendingSyncError(new ApiError(401, 'device_required', 'no'))).toBe(false)
    expect(shouldDropPendingSyncError(new ApiError(400, 'csrf_missing', 'no'))).toBe(false)
  })

  it('sí tira errores definitivos de petición', () => {
    expect(shouldDropPendingSyncError(new ApiError(400, 'invalid_grant', 'bad'))).toBe(true)
    expect(shouldDropPendingSyncError(new ApiError(403, 'session_forbidden', 'no'))).toBe(true)
  })

  it('no tira 5xx ni errores desconocidos', () => {
    expect(shouldDropPendingSyncError(new ApiError(500, 'server', 'x'))).toBe(false)
    expect(shouldDropPendingSyncError(new Error('offline'))).toBe(false)
  })
})
