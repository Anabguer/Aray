export type MoneyPlayMode = 'change' | 'build' | 'spare' | 'sum' | 'mix'

export type CoinEuro = 200 | 100 | 50 | 20 | 10 | 5 | 2 | 1

/** Céntimos enteros. */
export interface MoneyMcqQuestion {
  kind: 'mcq'
  id: string
  mode: MoneyPlayMode
  prompt: string
  detail?: string
  options: string[]
  /** Índice correcto; valor en céntimos o etiqueta. */
  correctIndex: number
}

export interface MoneyBuildQuestion {
  kind: 'build'
  id: string
  mode: MoneyPlayMode
  prompt: string
  targetCents: number
  coins: CoinEuro[]
}

export type MoneyQuestion = MoneyMcqQuestion | MoneyBuildQuestion

export interface MoneySessionSummary {
  mode: MoneyPlayMode
  total: number
  correct: number
  bestStreak: number
}

export const MONEY_ROUND_SIZE = 8

export const MONEY_MODE_LABELS: Record<MoneyPlayMode, string> = {
  change: '¿Cuánto te devuelven?',
  build: 'Construye el precio',
  spare: '¿Cuál sobra?',
  sum: '¿Cuánto dinero hay?',
  mix: 'Todo mezclado',
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
