export type ClockLang = 'es' | 'ca'

export type ClockHour = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

/** Minutos en pasos de 5. */
export type ClockMinute = 0 | 5 | 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50 | 55

export interface ClockTime {
  hour: ClockHour
  minute: ClockMinute
}

export type ClockPlayMode = 'learn' | 'train' | 'match'

export interface ClockMcqQuestion {
  id: string
  time: ClockTime
  /** Índice 0–3 de la opción correcta. */
  correctIndex: number
  options: string[]
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

export const CLOCK_MINUTES: ClockMinute[] = [
  0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55,
]
