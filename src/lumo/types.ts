export type LumoState =
  | 'idle'
  | 'thinking'
  | 'correct'
  | 'incorrect'
  | 'streak'
  | 'celebration'

export type LumoIntensity = 0 | 1 | 2 | 3 | 4

export interface LumoReactionConfig {
  state: LumoState
  intensity: LumoIntensity
  durationMs: number
  message?: string | null
}

export const lumoDurations = {
  correct: 700,
  incorrect: 900,
  streak: 1100,
  celebration: 1800,
  thinking: 0,
} as const

export function reactionFromAnswer(opts: {
  correct: boolean
  streak: number
  personalBest?: boolean
  dailyComplete?: boolean
  goalComplete?: boolean
}): LumoReactionConfig {
  if (!opts.correct) {
    return { state: 'incorrect', intensity: 1, durationMs: lumoDurations.incorrect }
  }
  if (opts.goalComplete || opts.personalBest || opts.dailyComplete || opts.streak >= 10) {
    return {
      state: 'celebration',
      intensity: 4,
      durationMs: lumoDurations.celebration,
    }
  }
  if (opts.streak >= 5) {
    return { state: 'streak', intensity: 3, durationMs: lumoDurations.streak }
  }
  if (opts.streak >= 3) {
    return { state: 'streak', intensity: 2, durationMs: lumoDurations.streak }
  }
  return { state: 'correct', intensity: 1, durationMs: lumoDurations.correct }
}
