export type SpellPlayMode =
  | 'missing'
  | 'correct'
  | 'picture'
  | 'intruder'
  | 'complete'
  | 'mix'
  | 'review'

/**
 * Bloques alineados con 3.º / cicle mitjà (Catalunya + cuadernos CEIP Diputació / Maspe 3):
 * r-rr, hie-/hue-, ahí-hay-ay, hacer-echar, -aba, -illo/-illa, haber/hablar,
 * b/v, mb/mp, g/j, bu/bur/bus, c/z, tildes.
 */
export type SpellRuleId =
  | 'r-rr'
  | 'hie-hue'
  | 'h'
  | 'hay-ahi-ay'
  | 'hacer-echar'
  | 'aba'
  | 'll-illa'
  | 'll-y'
  | 'haber-hablar'
  | 'b-v'
  | 'd-z'
  | 'c-z-qu'
  | 'mb-mp'
  | 'mb-mp-nv'
  | 'g-j'
  | 'bu-bur'
  | 'gu-gue'
  | 'tilde'

export interface SpellWord {
  word: string
  distractors: [string, string, string]
  emoji: string
  rule: SpellRuleId
  tip: string
  hardIndex: number
}

export interface SpellMcqQuestion {
  kind: 'mcq'
  id: string
  mode: SpellPlayMode
  prompt: string
  tip?: string
  rule?: SpellRuleId
  display?: string
  emoji?: string
  options: string[]
  correctIndex: number
  /** Clave para registrar fallos/aciertos (palabra o ctx:id). */
  targetKey?: string
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
  missing: 'Letra de la regla',
  correct: 'Forma correcta',
  picture: 'Imagen y palabra',
  intruder: 'La intrusa',
  complete: 'Completa la frase',
  mix: 'Mezcla total',
  review: 'Mis fallos',
}
