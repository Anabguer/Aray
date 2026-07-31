import { apiPost } from '@/api/client'

const INTERVAL_MS = 30_000

let timerId: number | null = null
let started = false

async function ping(active: boolean): Promise<void> {
  try {
    await apiPost('/players/heartbeat.php', { active })
  } catch {
    /* silencioso: el tiempo se reintenta en el siguiente pulso */
  }
}

/** Pulso de presencia mientras el niño tiene la app abierta (cuenta tiempo de juego). */
export function startPlayHeartbeat(): void {
  if (typeof window === 'undefined' || started) return
  started = true

  const tick = () => {
    if (document.visibilityState !== 'visible') return
    void ping(true)
  }

  tick()
  timerId = window.setInterval(tick, INTERVAL_MS)

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void ping(true)
    else void ping(false)
  })

  window.addEventListener('pagehide', () => {
    void ping(false)
  })
}

export function stopPlayHeartbeat(): void {
  if (timerId != null) {
    window.clearInterval(timerId)
    timerId = null
  }
  started = false
}
