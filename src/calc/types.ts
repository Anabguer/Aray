export type CalcPlayMode =
  | 'add'
  | 'sub'
  | 'missing'
  | 'doubles'
  | 'halves'
  | 'near10'
  | 'compare'
  | 'order'
  | 'truefalse'
  | 'mix'

export type CalcQuestionKind =
  | 'mcq'
  | 'order'
  | 'truefalse'
  | 'compare'

export interface CalcMcqQuestion {
  kind: 'mcq'
  id: string
  mode: CalcPlayMode
  prompt: string
  /** Expresión grande opcional (p. ej. "7 + 8"). */
  expression?: string
  options: string[]
  correctIndex: number
}

export interface CalcOrderQuestion {
  kind: 'order'
  id: string
  mode: 'order' | 'mix'
  prompt: string
  items: number[]
  answer: number[]
}

export interface CalcTrueFalseQuestion {
  kind: 'truefalse'
  id: string
  mode: 'truefalse' | 'mix'
  prompt: string
  expression: string
  /** true = la expresión es correcta. */
  isTrue: boolean
}

export interface CalcCompareQuestion {
  kind: 'compare'
  id: string
  mode: 'compare' | 'mix'
  prompt: string
  left: number
  right: number
  /** 'left' | 'right' | 'equal' — v1 solo left/right. */
  greater: 'left' | 'right'
}

export type CalcQuestion =
  | CalcMcqQuestion
  | CalcOrderQuestion
  | CalcTrueFalseQuestion
  | CalcCompareQuestion

export interface CalcSessionSummary {
  mode: CalcPlayMode
  total: number
  correct: number
  bestStreak: number
  durationSec: number
}

/** Duración de partida (pensar rápido). */
export const CALC_DURATION_SEC = 45

export const CALC_MODE_LABELS: Record<CalcPlayMode, string> = {
  add: 'Suma rápida',
  sub: 'Resta rápida',
  missing: '¿Qué falta?',
  doubles: 'Dobles',
  halves: 'Mitades',
  near10: 'Hasta 10 / 100',
  compare: 'Comparar',
  order: 'Ordena',
  truefalse: 'Verdadero / falso',
  mix: 'Todo mezclado',
}
