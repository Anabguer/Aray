import { describe, expect, it } from 'vitest'
import {
  createInitialRewardProgress,
  grantRewardPoints,
  remainingDailyCapacity,
  syncRewardDay,
} from '@/reward/engine'
import { computeTablesRewardRequest } from '@/reward/tablesReward'
import { resolveActivityWeight } from '@/reward/tablesReward'
import { makeFact } from '@/math/tables'
import type { SessionAnswer } from '@/math/types'

function ans(a: number, b: number, correct: boolean, id: string): SessionAnswer {
  return {
    fact: makeFact(a, b),
    correct,
    selected: correct ? a * b : 0,
    elapsedMs: 10,
    attemptId: id,
  }
}

describe('puntos de recompensa', () => {
  it('una multiplicación correcta pide 1 punto; incorrecta 0', () => {
    expect(computeTablesRewardRequest([ans(7, 8, true, '1')]).requestedPoints).toBe(1)
    expect(computeTablesRewardRequest([ans(7, 8, false, '2')]).requestedPoints).toBe(0)
  })

  it('corrección posterior concede el punto pendiente de esa operación', () => {
    const req = computeTablesRewardRequest([
      ans(7, 8, false, 'a'),
      ans(7, 8, true, 'b'),
    ])
    expect(req.requestedPoints).toBe(1)
  })

  it('una misma operación canónica no concede dos veces en la sesión', () => {
    const req = computeTablesRewardRequest([
      ans(3, 7, true, 'a'),
      ans(7, 3, true, 'b'),
    ])
    expect(req.requestedPoints).toBe(1)
  })

  it('doble attemptId idéntico no duplica', () => {
    const req = computeTablesRewardRequest([
      ans(5, 5, true, 'same'),
      ans(5, 5, true, 'same'),
    ])
    expect(req.requestedPoints).toBe(1)
  })

  it('respeta tope diario con concesión parcial', () => {
    const reward = createInitialRewardProgress()
    reward.dailyDate = '2026-07-29'
    reward.dailyPoints = 8
    const grant = grantRewardPoints(
      reward,
      { requestedPoints: 5, sessionId: 's1', attemptIds: ['1'] },
      '2026-07-29',
    )
    expect(grant.granted).toBe(2)
    expect(grant.reward.dailyPoints).toBe(10)
    expect(grant.dailyComplete).toBe(true)
  })

  it('al llegar a 500 marca premio y el sobrante pasa al siguiente ciclo', () => {
    const reward = createInitialRewardProgress()
    reward.pointsTotal = 495
    reward.dailyDate = '2026-07-29'
    const grant = grantRewardPoints(
      reward,
      { requestedPoints: 10, sessionId: 's2', attemptIds: [] },
      '2026-07-29',
    )
    expect(grant.granted).toBe(10)
    expect(grant.reward.pendingCycleNumbers).toContain(1)
    expect(grant.reward.currentCycleNumber).toBe(2)
    expect(grant.reward.pointsTotal).toBe(5)
    expect(grant.goalJustCompleted).toBe(true)
    expect(grant.reward.goalStatus).toBe('completed')
  })

  it('al cambiar de día local reinicia diario y conserva total', () => {
    let reward = createInitialRewardProgress()
    reward.pointsTotal = 40
    reward.dailyDate = '2026-07-28'
    reward.dailyPoints = 10
    reward = syncRewardDay(reward, '2026-07-29')
    expect(reward.dailyPoints).toBe(0)
    expect(reward.pointsTotal).toBe(40)
    expect(remainingDailyCapacity(reward, '2026-07-29')).toBe(10)
  })

  it('pesos por tipo de actividad son configurables', () => {
    expect(resolveActivityWeight('micro')).toBe(1)
    expect(resolveActivityWeight('medium')).toBe(3)
    expect(resolveActivityWeight('special', 9)).toBe(9)
  })

  it('con premio pendiente sigue concediendo al ciclo siguiente', () => {
    const reward = createInitialRewardProgress()
    reward.pointsTotal = 10
    reward.currentCycleNumber = 2
    reward.pendingCycleNumbers = [1]
    reward.goalStatus = 'completed'
    reward.dailyDate = '2026-07-29'
    const grant = grantRewardPoints(
      reward,
      { requestedPoints: 5, sessionId: 's3', attemptIds: [] },
      '2026-07-29',
    )
    expect(grant.granted).toBe(5)
    expect(grant.reward.pointsTotal).toBe(15)
    expect(grant.reward.pendingCycleNumbers).toEqual([1])
  })
})
