import type { CrateRarity } from '@/assets/rewards'

export type CrateRewardKind = 'coins' | 'energy' | 'xp'

export interface CrateRewardSpec {
  kind: CrateRewardKind
  amount: number
}

export const crateConfig = {
  /** Probabilidad de caer caja al completar actividad. */
  dropChanceByActivity: {
    train: 0.2,
    challenge: 0.25,
    match: 0.2,
    misses: 0.2,
    missionOfDay: 0.35,
    firstMastery: 1,
  },
  pityAfterCompletions: 5,
  choiceBetweenTwoChance: 0.3,
  rarityWeights: {
    normal: 72,
    especial: 23,
    epica: 5,
  } as Record<CrateRarity, number>,
  rewards: {
    normal: [
      { kind: 'coins', amount: 5 },
      { kind: 'coins', amount: 8 },
      { kind: 'coins', amount: 10 },
      { kind: 'energy', amount: 3 },
      { kind: 'energy', amount: 4 },
      { kind: 'energy', amount: 5 },
      { kind: 'xp', amount: 15 },
      { kind: 'xp', amount: 20 },
      { kind: 'xp', amount: 25 },
    ] as CrateRewardSpec[],
    especial: [
      { kind: 'coins', amount: 12 },
      { kind: 'coins', amount: 15 },
      { kind: 'coins', amount: 20 },
      { kind: 'energy', amount: 6 },
      { kind: 'energy', amount: 8 },
      { kind: 'energy', amount: 10 },
      { kind: 'xp', amount: 40 },
      { kind: 'xp', amount: 55 },
      { kind: 'xp', amount: 70 },
    ] as CrateRewardSpec[],
    epica: [
      { kind: 'coins', amount: 30 },
      { kind: 'coins', amount: 40 },
      { kind: 'coins', amount: 50 },
      { kind: 'energy', amount: 12 },
      { kind: 'energy', amount: 16 },
      { kind: 'energy', amount: 20 },
      { kind: 'xp', amount: 100 },
      { kind: 'xp', amount: 140 },
      { kind: 'xp', amount: 180 },
    ] as CrateRewardSpec[],
  } as Record<CrateRarity, CrateRewardSpec[]>,
  /** Si la energía se corta por tope, 1 energía → N monedas. */
  energyOverflowToCoins: 2,
  animMs: {
    enter: 400,
    shake: 550,
    open: 650,
    reveal: 320,
  },
} as const

export type CrateActivityKey = keyof typeof crateConfig.dropChanceByActivity
