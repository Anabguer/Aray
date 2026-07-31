import type { CrateRarity } from '@/assets/rewards'

export type CrateRewardKind = 'energy'

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
      { kind: 'energy', amount: 20 },
      { kind: 'energy', amount: 30 },
      { kind: 'energy', amount: 40 },
      { kind: 'energy', amount: 50 },
    ] as CrateRewardSpec[],
    especial: [
      { kind: 'energy', amount: 50 },
      { kind: 'energy', amount: 60 },
      { kind: 'energy', amount: 80 },
      { kind: 'energy', amount: 100 },
    ] as CrateRewardSpec[],
    epica: [
      { kind: 'energy', amount: 100 },
      { kind: 'energy', amount: 120 },
      { kind: 'energy', amount: 160 },
      { kind: 'energy', amount: 200 },
    ] as CrateRewardSpec[],
  } as Record<CrateRarity, CrateRewardSpec[]>,
  animMs: {
    enter: 400,
    shake: 550,
    open: 650,
    reveal: 320,
  },
} as const

export type CrateActivityKey = keyof typeof crateConfig.dropChanceByActivity
