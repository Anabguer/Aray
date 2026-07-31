import { describe, expect, it, beforeEach } from 'vitest'
import {
  dailyChallengeCandidatesForTests,
  pickDailyChallenge,
} from '@/curriculum/dailyChallenge'
import { createInitialProgress } from '@/progress/repository'
import type { ProgressState } from '@/math/types'
import { emptyTableProgress } from '@/math/tableMastery'

function withWeakTable(progress: ProgressState, n: number): ProgressState {
  const table = {
    ...emptyTableProgress(),
    practiced: true,
    attempts: 20,
    correct: 8,
    masteryScore: 80,
    bestRoundScore: 9,
    lastRoundScore: 4,
    consecutiveLowRounds: 3,
    everMastered: true,
  }
  return {
    ...progress,
    tables: { ...progress.tables, [String(n)]: table },
  }
}

describe('pickDailyChallenge', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('incluye asignaturas variadas en la piscina', () => {
    const pool = dailyChallengeCandidatesForTests(createInitialProgress())
    const ids = pool.map((c) => c.activityId)
    expect(ids).toEqual(expect.arrayContaining([
      'clock-hours-train',
      'calc-mental-mix',
      'money-change',
      'spelling-mix',
      'alphabet-random',
    ]))
  })

  it('prioriza tablas que necesitan refuerzo', () => {
    const progress = withWeakTable(createInitialProgress(), 7)
    const pool = dailyChallengeCandidatesForTests(progress)
    const weak = pool.find((c) => c.activityId === 'mult-table-7-train')
    expect(weak).toBeTruthy()
    expect(weak!.weight).toBeGreaterThan(50)
  })

  it('establece el mismo reto durante el día', () => {
    const progress = withWeakTable(createInitialProgress(), 4)
    const first = pickDailyChallenge(progress, '2026-07-31')
    const second = pickDailyChallenge(progress, '2026-07-31')
    expect(first?.activityId).toBeTruthy()
    expect(second?.activityId).toBe(first?.activityId)
    expect(first?.reason).toBe('daily_challenge')
  })

  it('prioriza fallos de multiplicación cuando hay wrongs', () => {
    const progress = createInitialProgress()
    progress.facts['3x7'] = {
      attempts: 10,
      correct: 2,
      wrong: 8,
      weight: 12,
      lastSeenAt: null,
    }
    const pool = dailyChallengeCandidatesForTests(progress)
    const misses = pool.find((c) => c.activityId === 'mult-misses-practice')
    expect(misses).toBeTruthy()
    expect(misses!.weight).toBeGreaterThan(40)
  })
})
