import { describe, expect, it } from 'vitest'
import { createInitialProgress } from '@/progress/repository'
import { applyLevelUpEnergyBonuses } from '@/progress/levelUpEnergy'
import { economyContract } from '@/config/economyContract'
import { XP_PER_LEVEL } from '@/progress/playerHud'
import {
  countClaimableAchievements,
  achievementCatalog,
  achievementIsUnlocked,
} from '@/achievements/catalog'

describe('level-up energy', () => {
  it('concede energía al cruzar umbral de nivel', () => {
    const before = createInitialProgress()
    before.xp = XP_PER_LEVEL - 10
    const after = { ...before, xp: XP_PER_LEVEL + 5 }
    const { next, events } = applyLevelUpEnergyBonuses(before, after, 'p1')
    expect(events).toHaveLength(1)
    expect(events[0]!.newLevel).toBe(2)
    expect(events[0]!.energyRequested).toBe(economyContract.levelUpEnergyBonus)
    expect(next.reward.dailyPoints).toBe(events[0]!.energyGranted)
  })

  it('no duplica si el sessionId de level-up ya está aplicado', () => {
    const before = createInitialProgress()
    before.xp = XP_PER_LEVEL - 1
    const after = { ...before, xp: XP_PER_LEVEL }
    const first = applyLevelUpEnergyBonuses(before, after, 'p1')
    const second = applyLevelUpEnergyBonuses(before, first.next, 'p1')
    expect(second.events).toHaveLength(0)
  })
})

describe('colección claimable', () => {
  it('cuenta logros desbloqueados no reclamados', () => {
    const progress = createInitialProgress()
    progress.lastPracticeAt = new Date().toISOString()
    const primera = achievementCatalog.find((a) => a.id === 'primera-mision')!
    expect(achievementIsUnlocked(primera, progress)).toBe(true)
    expect(countClaimableAchievements(progress)).toBeGreaterThanOrEqual(1)
    progress.achievements.claimedIds = ['primera-mision']
    expect(countClaimableAchievements(progress)).toBe(0)
  })
})
