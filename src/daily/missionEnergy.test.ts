import { describe, expect, it, beforeEach } from 'vitest'
import { missionEnergyConfig } from '@/config/rewardGoal'
import {
  computeSkillEnergyGrant,
  energyForMissionAttempt,
  hasMissionStatBeenCounted,
  isDailyMissionComplete,
  loadDailyMissionSnapshot,
  markMissionStatCounted,
  mergeDailyMissionSnapshots,
  remainingMissionEnergyBudget,
  saveDailyMissionSnapshot,
} from '@/daily/missionEnergy'
import { localDateString } from '@/reward/engine'

describe('missionEnergy', () => {
  const today = () => localDateString()

  beforeEach(() => {
    localStorage.clear()
  })

  it('las 5 skills de misión suman 100 de energía', () => {
    const snap = loadDailyMissionSnapshot(null, today())
    expect(remainingMissionEnergyBudget(snap)).toBe(100)
  })

  it('no otorga más allá de los slots de la skill', () => {
    const d = today()
    saveDailyMissionSnapshot(
      {
        date: d,
        progress: { tables: 0, calc: 4, spelling: 0, clocks: 0, money: 0 },
        challengeDone: false,
      },
      null,
    )
    const g = computeSkillEnergyGrant('calc', 5, loadDailyMissionSnapshot(null, d))
    expect(g.unitsCredited).toBe(1)
    expect(g.energy).toBe(missionEnergyConfig.perUnit.calc)
  })

  it('práctica extra = 0 energía', () => {
    const d = today()
    saveDailyMissionSnapshot(
      {
        date: d,
        progress: { tables: 6, calc: 5, spelling: 4, clocks: 2, money: 1 },
        challengeDone: true,
      },
      null,
    )
    expect(energyForMissionAttempt('tables', 10, null, d)).toBe(0)
    expect(remainingMissionEnergyBudget(loadDailyMissionSnapshot(null, d))).toBe(0)
  })

  it('merge monótono conserva el máximo entre dispositivos', () => {
    const d = today()
    const a = {
      date: d,
      progress: { tables: 2, calc: 0, spelling: 4, clocks: 0, money: 0 },
      challengeDone: false,
    }
    const b = {
      date: d,
      progress: { tables: 6, calc: 1, spelling: 1, clocks: 0, money: 0 },
      challengeDone: true,
    }
    const m = mergeDailyMissionSnapshots(a, b, d)
    expect(m.progress.tables).toBe(6)
    expect(m.progress.spelling).toBe(4)
    expect(m.progress.calc).toBe(1)
    expect(m.challengeDone).toBe(true)
  })

  it('detecta misión diaria completa y marca el contador de logro una vez', () => {
    const d = today()
    const incomplete = {
      date: d,
      progress: { tables: 6, calc: 5, spelling: 4, clocks: 2, money: 0 },
      challengeDone: false,
    }
    const complete = {
      date: d,
      progress: { tables: 6, calc: 5, spelling: 4, clocks: 2, money: 1 },
      challengeDone: true,
    }
    expect(isDailyMissionComplete(incomplete)).toBe(false)
    expect(isDailyMissionComplete(complete)).toBe(true)
    expect(hasMissionStatBeenCounted(null, d)).toBe(false)
    markMissionStatCounted(null, d)
    expect(hasMissionStatBeenCounted(null, d)).toBe(true)
    expect(hasMissionStatBeenCounted(null, '2099-01-01')).toBe(false)
  })
})
