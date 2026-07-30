/** Identificadores de efectos sonoros del juego. */
export const SOUND_IDS = [
  'ui-click',
  'activity-open',
  'answer-correct',
  'answer-wrong',
  'points-earned',
  'activity-complete',
  'perfect-complete',
] as const

export type SoundId = (typeof SOUND_IDS)[number]

/** API legacy (beeps) → sonidos de archivo. */
export type LegacyToneKind = 'correct' | 'wrong' | 'reward' | 'tick'

export const LEGACY_TONE_MAP: Record<LegacyToneKind, SoundId> = {
  correct: 'answer-correct',
  wrong: 'answer-wrong',
  reward: 'points-earned',
  tick: 'ui-click',
}

/** Sonidos “largos”: no se solapan entre sí. */
export const LONG_SOUNDS: ReadonlySet<SoundId> = new Set([
  'activity-complete',
  'perfect-complete',
  'points-earned',
  'activity-open',
])

export function isSoundId(value: string): value is SoundId {
  return (SOUND_IDS as readonly string[]).includes(value)
}

export function resolveSoundId(kind: SoundId | LegacyToneKind): SoundId {
  if (isSoundId(kind)) return kind
  return LEGACY_TONE_MAP[kind]
}
