/**
 * Microcelebraciones de partida (solo feedback visual / Lumo).
 * Sin XP ni monedas. Breves y con reduced-motion.
 */

export type MicroCelebrateKind = 'streakStart' | 'streak3' | 'streak5' | 'sessionBest'

export type MicroCelebrateEvent = {
  kind: MicroCelebrateKind
  message: string
}

/** Umbral mínimo para celebrar récord de sesión (evita spam en 1–2). */
export const MICRO_BEST_MIN = 3

/**
 * Detecta un hito al subir la racha.
 * `prevStreak` = racha antes del acierto; `nextStreak` = tras el acierto;
 * `sessionBestBefore` = mejor racha de la partida antes de este acierto.
 */
export function detectMicroCelebrate(
  prevStreak: number,
  nextStreak: number,
  sessionBestBefore: number,
): MicroCelebrateEvent | null {
  if (nextStreak <= prevStreak) return null
  if (nextStreak === 2 && prevStreak < 2) {
    return { kind: 'streakStart', message: '¡Racha!' }
  }
  if (nextStreak === 3) {
    return { kind: 'streak3', message: '¡Racha de 3!' }
  }
  if (nextStreak === 5) {
    return { kind: 'streak5', message: '¡Racha de 5!' }
  }
  if (nextStreak > sessionBestBefore && nextStreak >= MICRO_BEST_MIN) {
    return { kind: 'sessionBest', message: '¡Récord de la partida!' }
  }
  return null
}

export const MICRO_CELEBRATE_MS = 900
export const MICRO_CELEBRATE_MS_REDUCED = 400
