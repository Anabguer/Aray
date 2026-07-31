import { describe, expect, it } from 'vitest'
import {
  applyAlphabetSessionToProgress,
  alphabetModeStatus,
  emptyAlphabetProgress,
  evaluateAlphabetRoundScore,
} from '@/alphabet/progress'
import { createInitialProgress } from '@/progress/repository'

describe('progreso ABC', () => {
  it('escala la ronda a /10', () => {
    expect(evaluateAlphabetRoundScore(8, 8)).toBe(10)
    expect(evaluateAlphabetRoundScore(7, 8)).toBe(9)
    expect(evaluateAlphabetRoundScore(6, 8)).toBe(8)
  })

  it('doma un modo con buena ronda y marca repaso si baja', () => {
    const base = createInitialProgress()
    const answers = Array.from({ length: 8 }, (_, i) => ({
      questionId: `q${i}`,
      kind: 'missing' as const,
      correct: true,
      firstTry: true,
      focusLetter: 'A',
      attemptId: `a${i}`,
    }))
    const first = applyAlphabetSessionToProgress(base, {
      mode: 'missing',
      answers,
      sessionId: 'abc-1',
      bestStreakInRound: 8,
    })
    expect(first.next.alphabet.modes.missing?.everMastered).toBe(true)
    expect(first.result.xpEarned).toBeGreaterThan(0)
    expect(alphabetModeStatus(first.next.alphabet.modes.missing!).kind).toBe('mastered')

    const low = Array.from({ length: 8 }, (_, i) => ({
      questionId: `q${i}`,
      kind: 'missing' as const,
      correct: i < 3,
      firstTry: true,
      focusLetter: 'Z',
      attemptId: `b${i}`,
    }))
    const second = applyAlphabetSessionToProgress(first.next, {
      mode: 'missing',
      answers: low,
      sessionId: 'abc-2',
      bestStreakInRound: 2,
    })
    expect(second.next.alphabet.modes.missing?.everMastered).toBe(true)
    expect(alphabetModeStatus(second.next.alphabet.modes.missing!).recommendPractice).toBe(true)
  })

  it('no duplica XP si la sesión ya estaba aplicada', () => {
    const base = createInitialProgress()
    const answers = [
      {
        questionId: 'q0',
        kind: 'neighbor' as const,
        correct: true,
        firstTry: true,
        focusLetter: 'B',
        attemptId: 'x1',
      },
    ]
    const first = applyAlphabetSessionToProgress(base, {
      mode: 'neighbor',
      answers,
      sessionId: 'dup',
      bestStreakInRound: 1,
    })
    const second = applyAlphabetSessionToProgress(first.next, {
      mode: 'neighbor',
      answers,
      sessionId: 'dup',
      bestStreakInRound: 1,
    })
    expect(second.result.xpEarned).toBe(0)
    expect(second.next.xp).toBe(first.next.xp)
  })

  it('normaliza progreso vacío', () => {
    expect(emptyAlphabetProgress().roundsPlayed).toBe(0)
  })
})
