import type { CrateRarity } from '@/assets/rewards'
import {
  crateConfig,
  type CrateActivityKey,
  type CrateRewardSpec,
} from '@/config/crateConfig'

export interface PendingCrateOption {
  rarity: CrateRarity
  reward: CrateRewardSpec
}

export interface PendingCrate {
  completionId: string
  /** Rareza efectiva (tras elegir, si hay choice). */
  rarity: CrateRarity
  options: PendingCrateOption[]
  chosenIndex: number | null
  opened: boolean
  reward: CrateRewardSpec
  isChoice: boolean
}

export interface CratesState {
  pityWithoutCrate: number
  rolledCompletionIds: string[]
  claimedCompletionIds: string[]
  firstMasteryGrantedTables: string[]
  pending: PendingCrate | null
}

export function createInitialCratesState(): CratesState {
  return {
    pityWithoutCrate: 0,
    rolledCompletionIds: [],
    claimedCompletionIds: [],
    firstMasteryGrantedTables: [],
    pending: null,
  }
}

export function normalizeCratesState(raw: unknown): CratesState {
  const base = createInitialCratesState()
  if (!raw || typeof raw !== 'object') return base
  const p = raw as Partial<CratesState>
  return {
    pityWithoutCrate: typeof p.pityWithoutCrate === 'number' ? Math.max(0, p.pityWithoutCrate) : 0,
    rolledCompletionIds: Array.isArray(p.rolledCompletionIds)
      ? p.rolledCompletionIds.filter((id): id is string => typeof id === 'string')
      : [],
    claimedCompletionIds: Array.isArray(p.claimedCompletionIds)
      ? p.claimedCompletionIds.filter((id): id is string => typeof id === 'string')
      : [],
    firstMasteryGrantedTables: Array.isArray(p.firstMasteryGrantedTables)
      ? p.firstMasteryGrantedTables.filter((id): id is string => typeof id === 'string')
      : [],
    pending: normalizePending(p.pending),
  }
}

function normalizePending(raw: unknown): PendingCrate | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Partial<PendingCrate> & {
    rewardKind?: string
    rewardAmount?: number
    status?: string
  }
  if (typeof p.completionId !== 'string' || !Array.isArray(p.options)) return null

  const rewardFromFields =
    typeof p.rewardKind === 'string' && typeof p.rewardAmount === 'number'
      ? { kind: p.rewardKind as CrateRewardSpec['kind'], amount: p.rewardAmount }
      : null
  const reward = (p.reward as CrateRewardSpec | undefined) ?? rewardFromFields
  if (!reward || typeof reward.kind !== 'string' || typeof reward.amount !== 'number') return null

  const status = typeof p.status === 'string' ? p.status : null
  const opened =
    typeof p.opened === 'boolean'
      ? p.opened
      : status === 'pending_claim' || status === 'claimed'

  return {
    completionId: p.completionId,
    rarity: (p.rarity as CrateRarity) ?? 'normal',
    options: p.options as PendingCrateOption[],
    chosenIndex: typeof p.chosenIndex === 'number' ? p.chosenIndex : null,
    opened,
    reward,
    isChoice: Boolean(p.isChoice),
  }
}

function pickWeightedRarity(random: () => number): CrateRarity {
  const entries = Object.entries(crateConfig.rarityWeights) as [CrateRarity, number][]
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let ticket = random() * total
  for (const [rarity, weight] of entries) {
    ticket -= weight
    if (ticket <= 0) return rarity
  }
  return 'normal'
}

function pickReward(rarity: CrateRarity, random: () => number): CrateRewardSpec {
  const pool = crateConfig.rewards[rarity]
  return { ...pool[Math.floor(random() * pool.length)]! }
}

export function makeCrateOption(random: () => number = Math.random): PendingCrateOption {
  const rarity = pickWeightedRarity(random)
  return { rarity, reward: pickReward(rarity, random) }
}

export interface RollCrateInput {
  completionId: string
  activity: CrateActivityKey
  crates: CratesState
  /** Primera vez que esta tabla pasa a Domada en esta sesión. */
  newlyMasteredTable?: string | null
  isMissionOfDay?: boolean
  random?: () => number
}

export interface RollCrateResult {
  crates: CratesState
  pending: PendingCrate | null
  rolled: boolean
}

/**
 * Tirada idempotente: si completionId ya se sorteó, no vuelve a tirar.
 * Persiste pending antes de cualquier animación (el caller debe guardar el estado).
 */
export function rollCrateForCompletion(input: RollCrateInput): RollCrateResult {
  const random = input.random ?? Math.random
  let crates = { ...input.crates }

  if (crates.rolledCompletionIds.includes(input.completionId)) {
    const pending =
      crates.pending?.completionId === input.completionId
        ? crates.pending
        : crates.claimedCompletionIds.includes(input.completionId)
          ? null
          : crates.pending
    return { crates, pending, rolled: false }
  }

  const guaranteedMastery =
    Boolean(input.newlyMasteredTable) &&
    !crates.firstMasteryGrantedTables.includes(String(input.newlyMasteredTable))

  let activityKey: CrateActivityKey = input.activity
  if (guaranteedMastery) activityKey = 'firstMastery'
  else if (input.isMissionOfDay) activityKey = 'missionOfDay'

  const baseChance = crateConfig.dropChanceByActivity[activityKey]
  const pityHit = crates.pityWithoutCrate + 1 >= crateConfig.pityAfterCompletions
  const drops = guaranteedMastery || pityHit || random() < baseChance

  const nextRolled = [...crates.rolledCompletionIds, input.completionId]
  if (nextRolled.length > 80) nextRolled.splice(0, nextRolled.length - 80)

  if (!drops) {
    crates = {
      ...crates,
      pityWithoutCrate: crates.pityWithoutCrate + 1,
      rolledCompletionIds: nextRolled,
      pending: crates.pending,
    }
    return { crates, pending: null, rolled: true }
  }

  const isChoice = random() < crateConfig.choiceBetweenTwoChance
  const options = isChoice
    ? [makeCrateOption(random), makeCrateOption(random)]
    : [makeCrateOption(random)]

  const primary = options[0]!
  const pending: PendingCrate = {
    completionId: input.completionId,
    rarity: primary.rarity,
    options,
    chosenIndex: isChoice ? null : 0,
    opened: false,
    reward: primary.reward,
    isChoice,
  }

  const firstMastery = [...crates.firstMasteryGrantedTables]
  if (guaranteedMastery && input.newlyMasteredTable) {
    firstMastery.push(String(input.newlyMasteredTable))
  }

  crates = {
    ...crates,
    pityWithoutCrate: 0,
    rolledCompletionIds: nextRolled,
    firstMasteryGrantedTables: firstMastery,
    pending,
  }

  return { crates, pending, rolled: true }
}

export function chooseCrateOption(crates: CratesState, index: number): CratesState {
  if (!crates.pending || !crates.pending.isChoice) return crates
  if (crates.pending.chosenIndex !== null) return crates
  const option = crates.pending.options[index]
  if (!option) return crates
  return {
    ...crates,
    pending: {
      ...crates.pending,
      chosenIndex: index,
      rarity: option.rarity,
      reward: option.reward,
    },
  }
}

export function markCrateOpened(crates: CratesState): CratesState {
  if (!crates.pending || crates.pending.chosenIndex === null) return crates
  return {
    ...crates,
    pending: { ...crates.pending, opened: true },
  }
}

export interface CollectCrateResult {
  crates: CratesState
  applied: boolean
  reward: CrateRewardSpec | null
}

/** Aplica el premio una sola vez (idempotente por completionId). */
export function collectPendingCrate(crates: CratesState): CollectCrateResult {
  const pending = crates.pending
  if (!pending || !pending.opened || pending.chosenIndex === null) {
    return { crates, applied: false, reward: null }
  }
  if (crates.claimedCompletionIds.includes(pending.completionId)) {
    return {
      crates: { ...crates, pending: null },
      applied: false,
      reward: null,
    }
  }
  const claimed = [...crates.claimedCompletionIds, pending.completionId]
  if (claimed.length > 80) claimed.splice(0, claimed.length - 80)
  return {
    crates: {
      ...crates,
      claimedCompletionIds: claimed,
      pending: null,
    },
    applied: true,
    reward: pending.reward,
  }
}
