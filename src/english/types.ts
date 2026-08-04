export type EnglishPlayMode =
  | 'meaning'
  | 'translate'
  | 'intruder'
  | 'missing'
  | 'match'
  | 'mix'
  | 'review'

export type EnglishMcqQuestion = {
  kind: 'mcq'
  id: string
  mode: EnglishPlayMode
  prompt: string
  tip?: string
  display?: string
  options: string[]
  correctIndex: number
  /** packId:lemmaId */
  targetKey: string
  /** Modo concreto que generó la pregunta (útil en mix/review). */
  sourceMode: Exclude<EnglishPlayMode, 'mix' | 'review' | 'match'>
}

export type EnglishSessionSummary = {
  packId: string
  mode: EnglishPlayMode
  total: number
  correct: number
  bestStreak: number
}

export const ENGLISH_ROUND_SIZE = 12

export const ENGLISH_MODE_LABELS: Record<EnglishPlayMode, string> = {
  meaning: '¿Qué significa?',
  translate: '¿Cómo se dice?',
  intruder: 'Palabra intrusa',
  missing: 'Letra que falta',
  match: 'Empareja',
  mix: 'Mezcla',
  review: 'Mis fallos',
}

export const ENGLISH_PLAYABLE_MODES: Exclude<
  EnglishPlayMode,
  'mix' | 'review' | 'match'
>[] = ['meaning', 'translate', 'intruder', 'missing']
