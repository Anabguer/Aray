import { describe, expect, it, beforeEach } from 'vitest'
import { missionEnergyConfig } from '@/config/rewardGoal'
import {
  computeSkillEnergyGrant,
  energyForMissionAttempt,
  loadDailyMissionSnapshot,
  remainingMissionEnergyBudget,
  saveDailyMissionSnapshot,
} from '@/daily/missionEnergy'

describe('missionEnergy', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('las 5 skills de misión suman 100 de energía', () => {
    const snap = loadDailyMissionSnapshot(null, '2026-07-31')
    expect(remainingMissionEnergyBudget(snap)).toBe(100)
  })

  it('no otorga más allá de los slots de la skill', () => {
    saveDailyMissionSnapshot(
      {
        date: '2026-07-31',
        progress: { tables: 0, calc: 4, spelling: 0, clocks: 0, money: 0 },
        challengeDone: false,
      },
      null,
    )
    const g = computeSkillEnergyGrant('calc', 5, loadDailyMissionSnapshot(null, '2026-07-31'))
    expect(g.unitsCredited).toBe(1)
    expect(g.energy).toBe(missionEnergyConfig.perUnit.calc)
  })

  it('práctica extra = 0 energía', () => {
    saveDailyMissionSnapshot(
      {
        date: '2026-07-31',
        progress: { tables: 6, calc: 5, spelling: 4, clocks: 2, money: 1 },
        challengeDone: true,
      },
      null,
    )
    expect(energyForMissionAttempt('tables', 10, null, '2026-07-31')).toBe(0)
    expect(remainingMissionEnergyBudget(loadDailyMissionSnapshot(null, '2026-07-31'))).toBe(0)
  })
})
