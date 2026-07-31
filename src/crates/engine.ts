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

function uniqueIds(ids: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const id of ids) {
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  if (out.length > 80) out.splice(0, out.length - 80)
  return out
}

/**
 * Fusiona cajas del servidor con historial local.
 * Si ya se recogió en este dispositivo, no reaparece el modal al hidratar.
 */
export function mergeCratesState(server: CratesState, local: CratesState): CratesState {
  const claimedCompletionIds = uniqueIds([
    ...local.claimedCompletionIds,
    ...server.claimedCompletionIds,
  ])
  const rolledCompletionIds = uniqueIds([
    ...local.rolledCompletionIds,
    ...server.rolledCompletionIds,
  ])
  const firstMasteryGrantedTables = uniqueIds([
    ...local.firstMasteryGrantedTables,
    ...server.firstMasteryGrantedTables,
  ])

  let pending = server.pending
  if (pending && claimedCompletionIds.includes(pending.completionId)) {
    pending = null
  }

  return {
    pityWithoutCrate: server.pityWithoutCrate,
    claimedCompletionIds,
    rolledCompletionIds,
    firstMasteryGrantedTables,
    pending,
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

const RARITY_RANK: Record<CrateRarity, number> = {
  normal: 0,
  especial: 1,
  epica: 2,
}

function makeOptionOfRarity(rarity: CrateRarity, random: () => number): PendingCrateOption {
  return { rarity, reward: pickReward(rarity, random) }
}

/**
 * Pareja para el modal de elección: una “buena” (normal) y otra mejor
 * (especial/épica) con más energía. El lado se baraja.
 */
export function makeChoiceCratePair(random: () => number = Math.random): PendingCrateOption[] {
  const safe = makeOptionOfRarity('normal', random)
  const jackpotRarity: CrateRarity = random() < 0.65 ? 'especial' : 'epica'
  let jackpot = makeOptionOfRarity(jackpotRarity, random)

  if (jackpot.reward.amount <= safe.reward.amount) {
    const betterPool = crateConfig.rewards[jackpotRarity].filter(
      (r) => r.amount > safe.reward.amount,
    )
    if (betterPool.length > 0) {
      jackpot = {
        rarity: jackpotRarity,
        reward: { ...betterPool[Math.floor(random() * betterPool.length)]! },
      }
    } else {
      const epicPool = crateConfig.rewards.epica.filter((r) => r.amount > safe.reward.amount)
      jackpot = {
        rarity: 'epica',
        reward: { ...(epicPool[Math.floor(random() * epicPool.length)] ?? crateConfig.rewards.epica.at(-1)!) },
      }
    }
  }

  // Defensa extra: rareza del jackpot siempre estrictamente mayor.
  if (RARITY_RANK[jackpot.rarity] <= RARITY_RANK[safe.rarity]) {
    jackpot = makeOptionOfRarity('epica', random)
    if (jackpot.reward.amount <= safe.reward.amount) {
      jackpot = {
        rarity: 'epica',
        reward: { ...crateConfig.rewards.epica[crateConfig.rewards.epica.length - 1]! },
      }
    }
  }

  return random() < 0.5 ? [safe, jackpot] : [jackpot, safe]
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
  const options = isChoice ? makeChoiceCratePair(random) : [makeCrateOption(random)]

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
