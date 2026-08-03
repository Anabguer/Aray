import { describe, expect, it } from 'vitest'
import {
  buildMissesQueue,
  buildTrainQueue,
  maxSameFactPerQueue,
  pickNextFact,
  scheduleRetry,
  uniqueFactsByKey,
} from '@/math/selector'
import { createInitialProgress } from '@/progress/repository'
import { factKeyOf, factsForTables, makeFact } from '@/math/tables'
import type { ProgressState } from '@/math/types'

function progressWithHeavyFail(): ProgressState {
  const base = createInitialProgress()
  base.facts['7x8'] = {
    attempts: 4,
    correct: 1,
    wrong: 3,
    weight: 10,
    lastSeenAt: new Date().toISOString(),
  }
  return base
}

function progressWithOnly79(): ProgressState {
  const base = createInitialProgress()
  base.facts['7x9'] = {
    attempts: 8,
    correct: 0,
    wrong: 8,
    weight: 12,
    lastSeenAt: new Date().toISOString(),
  }
  return base
}

describe('selección y fallos', () => {
  it('no repite la misma clave canónica de forma consecutiva', () => {
    const pool = uniqueFactsByKey(factsForTables([7]))
    const progress = createInitialProgress()
    let last = factKeyOf(pickNextFact(pool, progress, null, () => 0.1))
    for (let i = 0; i < 30; i += 1) {
      const next = pickNextFact(pool, progress, last, () => (i % 9) / 10)
      expect(factKeyOf(next)).not.toBe(last)
      last = factKeyOf(next)
    }
  })

  it('prioriza operaciones con más peso (falladas)', () => {
    const pool = uniqueFactsByKey(factsForTables([7]))
    const progress = progressWithHeavyFail()
    let hits = 0
    for (let i = 0; i < 80; i += 1) {
      const fact = pickNextFact(pool, progress, null, () => (i + 0.5) / 80)
      if (factKeyOf(fact) === '7x8') hits += 1
    }
    expect(hits).toBeGreaterThan(8)
  })

  it('programa el reintento más adelante, no en la posición inmediata', () => {
    const remaining = [
      { fact: makeFact(3, 1), options: [3, 4, 5, 6] },
      { fact: makeFact(3, 2), options: [6, 7, 8, 9] },
      { fact: makeFact(3, 4), options: [12, 13, 14, 15] },
    ]
    const failed = makeFact(3, 9)
    const next = scheduleRetry(remaining, failed, () => 0)
    expect(next.length).toBe(4)
    expect(factKeyOf(next[0]!.fact)).toBe('1x3')
    expect(next.some((q, i) => i > 0 && factKeyOf(q.fact) === '3x9')).toBe(true)
  })

  it('practicar mis fallos prioriza erróneas pero no llena la ronda con una sola', () => {
    const empty = buildMissesQueue(createInitialProgress(), 5, () => 0.2)
    expect(empty.usedFallbackMix).toBe(true)
    expect(empty.queue).toHaveLength(5)

    const withFails = buildMissesQueue(progressWithHeavyFail(), 10, () => 0.3)
    expect(withFails.usedFallbackMix).toBe(false)
    const counts = new Map<string, number>()
    for (const q of withFails.queue) {
      const key = factKeyOf(q.fact)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    expect(counts.get('7x8') ?? 0).toBeGreaterThan(0)
    expect(counts.get('7x8') ?? 0).toBeLessThanOrEqual(maxSameFactPerQueue)
    expect(counts.size).toBeGreaterThan(1)
  })

  it('no satura la cola con 7×9 / 9×7 aunque el peso sea extremo', () => {
    const queue = buildTrainQueue([7, 9], progressWithOnly79(), 10, () => 0.15)
    const counts = new Map<string, number>()
    for (const q of queue) {
      const key = factKeyOf(q.fact)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    expect(counts.get('7x9') ?? 0).toBeLessThanOrEqual(maxSameFactPerQueue)
    expect(counts.size).toBeGreaterThanOrEqual(5)

    for (let i = 1; i < queue.length; i += 1) {
      expect(factKeyOf(queue[i]!.fact)).not.toBe(factKeyOf(queue[i - 1]!.fact))
    }
  })

  it('deduplica 7×9 y 9×7 en el pool de mezcla', () => {
    const pool = uniqueFactsByKey(factsForTables([7, 9]))
    const keys = pool.map(factKeyOf)
    expect(keys.filter((k) => k === '7x9')).toHaveLength(1)
  })
})
