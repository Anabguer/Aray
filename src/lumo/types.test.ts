import { describe, expect, it } from 'vitest'
import { reactionFromAnswer } from '@/lumo/types'

describe('Lumo reacciones', () => {
  it('asigna incorrect ante fallo', () => {
    expect(reactionFromAnswer({ correct: false, streak: 0 }).state).toBe('incorrect')
  })

  it('asigna correct en primeros aciertos', () => {
    expect(reactionFromAnswer({ correct: true, streak: 1 }).state).toBe('correct')
    expect(reactionFromAnswer({ correct: true, streak: 2 }).intensity).toBe(1)
  })

  it('sube a streak en 3 y 5', () => {
    expect(reactionFromAnswer({ correct: true, streak: 3 }).state).toBe('streak')
    expect(reactionFromAnswer({ correct: true, streak: 3 }).intensity).toBe(2)
    expect(reactionFromAnswer({ correct: true, streak: 5 }).intensity).toBe(3)
  })

  it('celebra en racha 10, récord o meta diaria/global', () => {
    expect(reactionFromAnswer({ correct: true, streak: 10 }).state).toBe('celebration')
    expect(reactionFromAnswer({ correct: true, streak: 2, personalBest: true }).state).toBe(
      'celebration',
    )
    expect(reactionFromAnswer({ correct: true, streak: 1, dailyComplete: true }).state).toBe(
      'celebration',
    )
    expect(reactionFromAnswer({ correct: true, streak: 1, goalComplete: true }).state).toBe(
      'celebration',
    )
  })
})
