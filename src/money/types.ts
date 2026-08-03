export type MoneyPlayMode = 'change' | 'build' | 'spare' | 'sum' | 'shortfall' | 'mix'

export type CoinEuro = 200 | 100 | 50 | 20 | 10 | 5 | 2 | 1

/** Pieza visual: billete rectangular o moneda redonda (céntimos). */
export type MoneyPiece = { kind: 'bill' | 'coin'; cents: number }

/** Grupo etiquetado (p. ej. Cuesta / Pagas). */
export type MoneySceneGroup = { label: string; pieces: MoneyPiece[] }

/** Céntimos enteros. */
export interface MoneyMcqQuestion {
  kind: 'mcq'
  id: string
  /** Identidad estable de contenido (Mis fallos). */
  questionId?: string
  mode: MoneyPlayMode
  prompt: string
  detail?: string
  /** Piezas sueltas (suma / sobra). */
  pieces?: MoneyPiece[]
  /** Escena con grupos etiquetados (cambio / te falta). */
  scene?: MoneySceneGroup[]
  options: string[]
  /** Índice correcto; valor en céntimos o etiqueta. */
  correctIndex: number
}

export interface MoneyBuildQuestion {
  kind: 'build'
  id: string
  questionId?: string
  mode: MoneyPlayMode
  prompt: string
  targetCents: number
  coins: CoinEuro[]
}

export type MoneyQuestion = MoneyMcqQuestion | MoneyBuildQuestion

export interface MoneySessionSummary {
  mode: MoneyPlayModeOrMisses
  total: number
  correct: number
  bestStreak: number
}

export const MONEY_ROUND_SIZE = 8

export type MoneyPlayModeOrMisses = MoneyPlayMode | 'misses'

export const MONEY_MODE_LABELS: Record<MoneyPlayModeOrMisses, string> = {
  change: '¿Cuánto te devuelven?',
  build: 'Construye el precio',
  spare: '¿Cuál sobra?',
  sum: '¿Cuánto dinero hay?',
  shortfall: '¿Cuánto te falta?',
  mix: 'Todo mezclado',
  misses: 'Mis fallos',
}

export const COIN_LABEL: Record<CoinEuro, string> = {
  200: '2 €',
  100: '1 €',
  50: '50 cts',
  20: '20 cts',
  10: '10 cts',
  5: '5 cts',
  2: '2 cts',
  1: '1 ct',
}
