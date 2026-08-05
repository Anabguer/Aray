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

export type CalcQuestionKind = 'mcq' | 'order' | 'truefalse' | 'compare'

/** Clasificación interna (no se muestra en UI todavía). */
export type CalcDifficulty = 'easy' | 'medium' | 'hard'

export interface CalcMcqQuestion {
  kind: 'mcq'
  id: string
  /** Identidad estable de contenido (Mis fallos). */
  questionId?: string
  mode: CalcPlayMode
  difficulty: CalcDifficulty
  prompt: string
  /** Expresión grande opcional (p. ej. "7 + 8"). */
  expression?: string
  options: string[]
  correctIndex: number
}

export interface CalcOrderQuestion {
  kind: 'order'
  id: string
  questionId?: string
  mode: 'order' | 'mix'
  difficulty: CalcDifficulty
  prompt: string
  items: number[]
  answer: number[]
}

export interface CalcTrueFalseQuestion {
  kind: 'truefalse'
  id: string
  questionId?: string
  mode: 'truefalse' | 'mix'
  difficulty: CalcDifficulty
  prompt: string
  expression: string
  /** true = la expresión es correcta. */
  isTrue: boolean
}

export interface CalcCompareQuestion {
  kind: 'compare'
  id: string
  questionId?: string
  mode: 'compare' | 'mix'
  difficulty: CalcDifficulty
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
  mode: CalcPlayModeOrMisses
  total: number
  correct: number
  bestStreak: number
  durationSec: number
}

/** Preguntas por ronda (sin cronómetro). */
export const CALC_ROUND_SIZE = 12

export type CalcPlayModeOrMisses = CalcPlayMode | 'misses'

export const CALC_MODE_LABELS: Record<CalcPlayModeOrMisses, string> = {
  add: 'Sumas',
  sub: 'Restas',
  missing: '¿Qué falta?',
  doubles: 'Dobles',
  halves: 'Mitades',
  near10: 'Hasta 10 / 100',
  compare: 'Comparar',
  order: 'Ordena',
  truefalse: 'Verdadero / falso',
  mix: 'Todo mezclado',
  misses: 'Mis fallos',
}
