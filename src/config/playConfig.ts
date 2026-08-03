/** Tablas con misión propia en UI (2–9). 1 y 10 no se farmean como tarjeta. */
export const PLAYABLE_TABLES = [2, 3, 4, 5, 6, 7, 8, 9] as const

export type PlayableTable = (typeof PLAYABLE_TABLES)[number]

/** Mezcla = todas las tablas jugables (2–9). */
export const MIX_TABLES: number[] = [...PLAYABLE_TABLES]

/** Rango global de multiplicadores (`tabla × b`) en Aprende / Empareja. */
export const MAX_MULTIPLIER = 10

/** Rango global de multiplicadores en Empareja (`tabla × b`). */
export const matchFactorRange = { min: 1, max: MAX_MULTIPLIER } as const

export const challengeModeConfig = {
  durationSec: 60,
  countdownSec: 3,
  /** Fracción restante: por encima = ok, entre warn y ok = warn, bajo warn = urgent */
  colorOkAbove: 0.45,
  colorWarnAbove: 0.18,
  xpMultiplier: 2,
  coinMultiplier: 2,
  rewardMultiplier: 1,
  maxRewardFromItems: 30, // 6 × 5 (slots misión tablas)

} as const

export const learnLayout = {
  unitMinPx: 8,
  unitMaxPx: 18,
  gapPx: 3,
  maxVisibleHeightPx: 160,
} as const

/** Tamaño de unidad en Aprende (no crece para llenar el viewport). */
export function learnUnitSizePx(product: number, columns: number): number {
  const { unitMinPx, unitMaxPx, gapPx, maxVisibleHeightPx } = learnLayout
  if (product <= 0) return unitMaxPx
  const rows = Math.ceil(product / Math.max(1, columns))
  const byHeight = Math.floor((maxVisibleHeightPx - gapPx * Math.max(0, rows - 1)) / rows)
  const byWidthBudget = columns >= 8 ? unitMinPx + 2 : columns >= 6 ? unitMinPx + 4 : unitMaxPx
  return Math.max(unitMinPx, Math.min(unitMaxPx, byHeight, byWidthBudget))
}
