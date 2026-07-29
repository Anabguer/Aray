import { useEffect, useRef } from 'react'
import { apiPost } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'

const INTERVAL_MS = 30_000
const BEAT_TIMEOUT_MS = 8_000

/** Envía heartbeat cada 30s si la pestaña está visible y el rol es niño. */
export function usePlayHeartbeat(): void {
  const { role, deviceAuthorized, csrf } = useAuth()
  const roleRef = useRef(role)
  roleRef.current = role

  useEffect(() => {
    if (role !== 'child' || !deviceAuthorized) return

    let timer: ReturnType<typeof setInterval> | null = null
    let aborted = false

    const beat = () => {
      if (aborted || document.visibilityState !== 'visible') return
      if (roleRef.current !== 'child') return
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
      const kill =
        ctrl && typeof window !== 'undefined'
          ? window.setTimeout(() => ctrl.abort(), BEAT_TIMEOUT_MS)
          : null
      void apiPost(
        '/players/heartbeat.php',
        { active: true, ...(csrf ? { csrf } : {}) },
        ctrl?.signal,
      )
        .catch(() => {
          /* silencioso: no interrumpir el juego */
        })
        .finally(() => {
          if (kill != null) window.clearTimeout(kill)
        })
    }

    const start = () => {
      if (timer) return
      beat()
      timer = setInterval(beat, INTERVAL_MS)
    }

    const stop = () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') start()
      else stop()
    }

    if (document.visibilityState === 'visible') start()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      aborted = true
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [role, deviceAuthorized, csrf])
}
