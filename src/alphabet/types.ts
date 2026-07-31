export const ALPHABET = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'Ñ',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
] as const

export type AlphabetLetter = (typeof ALPHABET)[number]

export type AlphabetPlayMode =
  | 'missing'
  | 'neighbor'
  | 'order-letters'
  | 'order-words'
  | 'random'

export type AlphabetDirection = 'asc' | 'desc'
export type NeighborDirection = 'next' | 'prev'

export type AlphabetDifficulty = 1 | 2 | 3

export interface MissingLetterQuestion {
  kind: 'missing'
  id: string
  /** Cadena con `null` en el hueco. */
  sequence: (AlphabetLetter | null)[]
  blankIndex: number
  answer: AlphabetLetter
  options: AlphabetLetter[]
  difficulty: AlphabetDifficulty
}

export interface NeighborQuestion {
  kind: 'neighbor'
  id: string
  letter: AlphabetLetter
  direction: NeighborDirection
  answer: AlphabetLetter
  options: AlphabetLetter[]
  difficulty: AlphabetDifficulty
}

export interface OrderLettersQuestion {
  kind: 'order-letters'
  id: string
  letters: AlphabetLetter[]
  answer: AlphabetLetter[]
  direction: AlphabetDirection
  difficulty: AlphabetDifficulty
}

export interface ScatterPos {
  /** Porcentaje horizontal 0–100. */
  x: number
  /** Porcentaje vertical 0–100. */
  y: number
  rotate: number
}

export interface OrderWordsQuestion {
  kind: 'order-words'
  id: string
  words: string[]
  answer: string[]
  direction: AlphabetDirection
  positions: ScatterPos[]
  difficulty: AlphabetDifficulty
}

export type AlphabetQuestion =
  | MissingLetterQuestion
  | NeighborQuestion
  | OrderLettersQuestion
  | OrderWordsQuestion

export interface AlphabetSessionSummary {
  mode: AlphabetPlayMode
  total: number
  correct: number
  wrong: number
  bestStreak: number
  roundScore?: number
  xpEarned?: number
  coinsEarned?: number
  rewardPointsEarned?: number
  rewardDailyComplete?: boolean
  recommendReview?: boolean
  statusLabel?: string
}

export const ALPHABET_ROUND_SIZE = 8

export const PRACTICE_WORDS = [
  'abeja',
  'barco',
  'casa',
  'dado',
  'elefante',
  'foca',
  'gato',
  'helado',
  'isla',
  'jugo',
  'koala',
  'luna',
  'mesa',
  'nube',
  'ñandú',
  'ojo',
  'pato',
  'queso',
  'ratón',
  'sol',
  'taza',
  'uva',
  'vaca',
  'waffle',
  'xilófono',
  'yoyo',
  'zapato',
] as const
