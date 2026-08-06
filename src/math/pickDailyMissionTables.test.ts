import { describe, expect, it, vi } from 'vitest'
import { launchDailyMissionTables } from '@/math/launchDailyMissionTables'
import {
  listDailyMissionTablesCandidates,
  pickDailyMissionTables,
} from '@/math/pickDailyMissionTables'
import { emptyTableProgress } from '@/math/tableMastery'
import { createInitialProgress } from '@/progress/repository'
import type { ProgressState } from '@/math/types'

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

describe('pickDailyMissionTables', () => {
  it('prioriza tablas que necesitan refuerzo', () => {
    const progress = withWeakTable(createInitialProgress(), 7)
    const pool = listDailyMissionTablesCandidates(progress)
    const weak = pool.find((c) => c.kind === 'train' && c.table === 7)
    expect(weak).toBeTruthy()
    expect(weak!.weight).toBeGreaterThan(50)
  })

  it('incluye mis fallos cuando hay wrongs', () => {
    const progress = createInitialProgress()
    progress.facts['3x7'] = {
      attempts: 10,
      correct: 2,
      wrong: 8,
      weight: 12,
      lastSeenAt: null,
    }
    const pool = listDailyMissionTablesCandidates(progress)
    const misses = pool.find((c) => c.kind === 'misses')
    expect(misses).toBeTruthy()
    expect(misses!.weight).toBeGreaterThan(40)
  })

  it('con RNG sesgado elige la tabla débil', () => {
    const progress = withWeakTable(createInitialProgress(), 8)
    const pool = listDailyMissionTablesCandidates(progress)
    const total = pool.reduce((s, c) => s + c.weight, 0)
    const beforeWeak = pool
      .slice(0, pool.findIndex((c) => c.kind === 'train' && c.table === 8))
      .reduce((s, c) => s + c.weight, 0)
    const pick = pickDailyMissionTables(progress, () => (beforeWeak + 1) / total)
    expect(pick).toEqual({ kind: 'train', table: 8 })
  })

  it('elige fallos cuando el roll cae en su franja', () => {
    const progress = createInitialProgress()
    progress.facts['4x4'] = {
      attempts: 5,
      correct: 0,
      wrong: 20,
      weight: 20,
      lastSeenAt: null,
    }
    const pool = listDailyMissionTablesCandidates(progress)
    const total = pool.reduce((s, c) => s + c.weight, 0)
    const beforeMisses = pool
      .slice(0, pool.findIndex((c) => c.kind === 'misses'))
      .reduce((s, c) => s + c.weight, 0)
    const roll = (beforeMisses + 0.5) / total
    const pick = pickDailyMissionTables(progress, () => roll)
    expect(pick).toEqual({ kind: 'misses' })
  })
})

describe('launchDailyMissionTables', () => {
  it('fija la tabla débil y navega a entrenar', () => {
    const navigate = vi.fn()
    const setSelection = vi.fn()
    const setActiveMode = vi.fn()
    const setPendingQueue = vi.fn()
    const setLastResult = vi.fn()
    const setFromRandom = vi.fn()

    const progress = withWeakTable(createInitialProgress(), 7)
    const pool = listDailyMissionTablesCandidates(progress)
    const total = pool.reduce((s, c) => s + c.weight, 0)
    const beforeWeak = pool
      .slice(0, pool.findIndex((c) => c.kind === 'train' && c.table === 7))
      .reduce((s, c) => s + c.weight, 0)

    launchDailyMissionTables(
      navigate,
      progress,
      { setSelection, setActiveMode, setPendingQueue, setLastResult, setFromRandom },
      () => (beforeWeak + 1) / total,
    )

    expect(setFromRandom).toHaveBeenCalledWith(false)
    expect(setLastResult).toHaveBeenCalledWith(null)
    expect(setSelection).toHaveBeenCalledWith({ tables: [7], mix: false })
    expect(setActiveMode).toHaveBeenCalledWith('train')
    expect(setPendingQueue).toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith('/missions/mates/tables/train')
  })

  it('lanza mis fallos cuando el pick es misses', () => {
    const navigate = vi.fn()
    const setSelection = vi.fn()
    const setActiveMode = vi.fn()
    const setPendingQueue = vi.fn()
    const setLastResult = vi.fn()
    const setFromRandom = vi.fn()

    const progress = createInitialProgress()
    progress.facts['3x7'] = {
      attempts: 10,
      correct: 2,
      wrong: 50,
      weight: 20,
      lastSeenAt: null,
    }

    launchDailyMissionTables(
      navigate,
      progress,
      { setSelection, setActiveMode, setPendingQueue, setLastResult, setFromRandom },
      () => 0.99,
    )

    expect(setActiveMode).toHaveBeenCalledWith('misses')
    expect(setPendingQueue).toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith('/missions/mates/tables/train', {
      state: { fallbackMix: false },
    })
  })
})
