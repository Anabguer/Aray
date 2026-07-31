export type SpellPlayMode =
  | 'missing'
  | 'correct'
  | 'picture'
  | 'intruder'
  | 'complete'
  | 'mix'

export interface SpellWord {
  word: string
  /** Letras alternativas incorrectas habituales. */
  distractors: string[]
  /** Emoji visual (modo imagen). */
  emoji: string
  /** Índice 0-based de la letra “difícil” (b/v, h, etc.). */
  hardIndex?: number
}

export interface SpellMcqQuestion {
  kind: 'mcq'
  id: string
  mode: SpellPlayMode
  prompt: string
  /** Texto con hueco, p. ej. ca_allo */
  display?: string
  emoji?: string
  options: string[]
  correctIndex: number
}

export type SpellQuestion = SpellMcqQuestion

export interface SpellSessionSummary {
  mode: SpellPlayMode
  total: number
  correct: number
  bestStreak: number
}

export const SPELL_ROUND_SIZE = 12

export const SPELL_MODE_LABELS: Record<SpellPlayMode, string> = {
  missing: 'Falta una letra',
  correct: '¿Cuál está bien?',
  picture: 'Imagen y palabra',
  intruder: 'Palabra intrusa',
  complete: 'Completa',
  mix: 'Todo mezclado',
}

/** Banco primario: confusiones b/v, h, ll/y, g/j, c/z… */
export const SPELL_BANK: SpellWord[] = [
  { word: 'vaca', distractors: ['baca', 'vaka'], emoji: '🐄', hardIndex: 0 },
  { word: 'barco', distractors: ['varco', 'barcoh'], emoji: '⛵', hardIndex: 0 },
  { word: 'caballo', distractors: ['cavallo', 'cabayo'], emoji: '🐴', hardIndex: 2 },
  { word: 'huevo', distractors: ['uevo', 'güevo'], emoji: '🥚', hardIndex: 0 },
  { word: 'hielo', distractors: ['ielo', 'yelo'], emoji: '🧊', hardIndex: 0 },
  { word: 'avión', distractors: ['abión', 'avion'], emoji: '✈️', hardIndex: 0 },
  { word: 'llave', distractors: ['yave', 'llabe'], emoji: '🔑', hardIndex: 0 },
  { word: 'lluvia', distractors: ['yuvía', 'llubia'], emoji: '🌧️', hardIndex: 0 },
  { word: 'zapato', distractors: ['sapato', 'çapato'], emoji: '👟', hardIndex: 0 },
  { word: 'casa', distractors: ['kasa', 'caza'], emoji: '🏠', hardIndex: 0 },
  { word: 'gato', distractors: ['jato', 'gatoo'], emoji: '🐱', hardIndex: 0 },
  { word: 'jugo', distractors: ['gugo', 'hugo'], emoji: '🧃', hardIndex: 0 },
  { word: 'bola', distractors: ['vola', 'bolla'], emoji: '⚽', hardIndex: 0 },
  { word: 'vaso', distractors: ['baso', 'vazo'], emoji: '🥛', hardIndex: 0 },
  { word: 'abeja', distractors: ['aveja', 'abeha'], emoji: '🐝', hardIndex: 1 },
  { word: 'hada', distractors: ['ada', 'jada'], emoji: '🧚', hardIndex: 0 },
  { word: 'ojo', distractors: ['oxo', 'hoyo'], emoji: '👁️', hardIndex: 0 },
  { word: 'libro', distractors: ['livro', 'libbro'], emoji: '📖', hardIndex: 2 },
  { word: 'nube', distractors: ['nuve', 'ñube'], emoji: '☁️', hardIndex: 2 },
  { word: 'sol', distractors: ['zol', 'soll'], emoji: '☀️', hardIndex: 0 },
]
