export type ClockLang = 'es' | 'ca'

export type ClockHour = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

/** Minutos 0–59 (Entrena mezcla pasos de 5 y minutos finos). */
export type ClockMinute = number

export interface ClockTime {
  hour: ClockHour
  minute: ClockMinute
}

export type ClockPlayMode = 'learn' | 'train' | 'match'

export interface ClockMcqQuestion {
  id: string
  /** Identidad estable de contenido (Mis fallos). */
  questionId?: string
  time: ClockTime
  /** Índice 0–3 de la opción correcta. */
  correctIndex: number
  options: string[]
  /** Si true, la pregunta es equivalencia 12↔24 (sin reloj analógico obligatorio). */
  kind?: 'read' | 'convert24'
  /** Texto de pregunta opcional (convert24). */
  prompt?: string
}

export interface ClockMatchPair {
  id: string
  time: ClockTime
  label: string
}

export interface ClockSessionSummary {
  mode: ClockPlayMode
  lang: ClockLang
  total: number
  correct: number
  bestStreak: number
}

/** Pasos de 5 (Learn / Match base). */
export const CLOCK_MINUTES: ClockMinute[] = [
  0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55,
]

/** Entrena: mezcla 5 en 5 + minutos “finos” de 3.º. */
export const CLOCK_MINUTES_TRAIN: ClockMinute[] = [
  ...CLOCK_MINUTES,
  1, 2, 3, 7, 8, 12, 13, 17, 18, 22, 23, 27, 28, 32, 33, 37, 38, 42, 43, 47, 48, 52, 53, 58,
]
