import { describe, expect, it } from 'vitest'
import { createInitialProgress } from '@/progress/repository'
import { derivePlayerHud } from '@/progress/playerHud'
import { rewardGoalConfig } from '@/config/rewardGoal'

describe('derivePlayerHud', () => {
  it('llena la barra de energía con el total del premio, no el tope diario', () => {
    const progress = createInitialProgress()
    progress.reward = {
      ...progress.reward,
      pointsTotal: 80,
      dailyPoints: 80,
      dailyDate: '2026-07-31',
    }

    const hud = derivePlayerHud(progress)

    expect(hud.energyTotal).toBe(80)
    expect(hud.energyTarget).toBe(rewardGoalConfig.targetPoints)
    expect(hud.energyToday).toBe(80)
    expect(hud.energyDailyCap).toBe(rewardGoalConfig.dailyCap)
    // 80/6000 ≈ 1%, no 80/100 = 80%
    expect(hud.energyBarPct).toBe(Math.round((80 / rewardGoalConfig.targetPoints) * 100))
    expect(hud.energyBarPct).toBeLessThan(5)
  })

  it('calcula nivel y XP del nivel actual (500 XP/nivel)', () => {
    const progress = createInitialProgress()
    progress.xp = 525
    const hud = derivePlayerHud(progress)
    expect(hud.level).toBe(2)
    expect(hud.xpIntoLevel).toBe(25)
    expect(hud.xpPct).toBe(5)
  })
})
