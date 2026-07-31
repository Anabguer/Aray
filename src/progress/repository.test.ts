import { describe, expect, it } from 'vitest'
import {
  applySessionToProgress,
  calculateSessionRewards,
  createInitialProgress,
  createLocalStorageProgressStore,
  normalizeProgress,
} from '@/progress/repository'
import { makeFact } from '@/math/tables'
import type { SessionAnswer } from '@/math/types'

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear() {
      map.clear()
    },
    getItem(key) {
      return map.has(key) ? map.get(key)! : null
    },
    key(index) {
      return [...map.keys()][index] ?? null
    },
    removeItem(key) {
      map.delete(key)
    },
    setItem(key, value) {
      map.set(key, value)
    },
  }
}

function ans(a: number, b: number, correct: boolean, id: string): SessionAnswer {
  return {
    fact: makeFact(a, b),
    correct,
    selected: correct ? a * b : a * b + 1,
    elapsedMs: 40,
    attemptId: id,
  }
}

describe('XP y progreso (sin monedas)', () => {
  it('calcula XP por aciertos y bonificación de racha', () => {
    const answers: SessionAnswer[] = Array.from({ length: 5 }, (_, i) =>
      ans(2, i + 1, true, `a${i}`),
    )
    const rewards = calculateSessionRewards('train', answers, 0, 5)
    expect(rewards.xpEarned).toBe(60)
    expect(rewards.coinsEarned).toBe(0)
    expect(rewards.bestStreak).toBe(5)
  })

  it('marca récord personal en el reto sin monedas', () => {
    const answers: SessionAnswer[] = [ans(4, 4, true, 'c1')]
    const rewards = calculateSessionRewards('challenge', answers, 10, 40)
    expect(rewards.personalBest).toBe(true)
    expect(rewards.coinsEarned).toBe(0)
  })

  it('guarda y recupera progreso; el reset lo limpia', () => {
    const storage = memoryStorage()
    const store = createLocalStorageProgressStore(storage)
    const base = createInitialProgress()
    base.xp = 40
    base.coins = 15
    store.save(base)
    expect(store.load().xp).toBe(40)
    store.clear()
    expect(store.load().xp).toBe(0)
  })

  it('migra progreso v1 sin reward y no convierte monedas', () => {
    const migrated = normalizeProgress({
      version: 1,
      xp: 20,
      coins: 80,
      bestStreak: 2,
      bestChallengeScore: 0,
      lastPracticeAt: null,
      facts: {},
      tables: {},
      soundMuted: false,
    })
    expect(migrated.version).toBe(6)
    expect(migrated.coins).toBe(80)
    expect(migrated.reward.pointsTotal).toBe(0)
    expect(migrated.xp).toBe(20)
    expect(migrated.school.currentCourseId).toBe('primary-3')
  })

  it('aplica sesión y sube el peso de los fallos', () => {
    const progress = createInitialProgress()
    const { next, result } = applySessionToProgress(progress, {
      mode: 'train',
      tables: [5],
      score: 1,
      bestStreak: 1,
      sessionId: 'sess-1',
      answers: [ans(5, 6, false, 'x1'), ans(5, 7, true, 'x2')],
    })
    expect(result.missedFacts).toHaveLength(1)
    expect(next.facts['5x6'].wrong).toBe(1)
    expect(next.facts['5x6'].weight).toBeGreaterThan(1)
    expect(next.tables['5'].practiced).toBe(true)
    expect(next.xp).toBeGreaterThan(0)
    expect(result.rewardPointsEarned).toBe(5)
  })

  it('no duplica recompensas al reaplicar la misma sesión', () => {
    const progress = createInitialProgress()
    const partial = {
      mode: 'train' as const,
      tables: [3],
      score: 2,
      bestStreak: 2,
      sessionId: 'sess-dup',
      answers: [ans(3, 3, true, 'd1'), ans(3, 4, true, 'd2')],
    }
    const first = applySessionToProgress(progress, partial)
    const second = applySessionToProgress(first.next, partial)
    expect(first.result.rewardPointsEarned).toBe(10)
    expect(second.result.rewardPointsEarned).toBe(0)
    expect(second.result.xpEarned).toBe(0)
    expect(second.next.xp).toBe(first.next.xp)
  })
})
