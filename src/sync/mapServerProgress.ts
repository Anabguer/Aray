import { createInitialCratesState, normalizeCratesState } from '@/crates/engine'
import {
  createDefaultSchoolProfile,
  normalizeActivityAssignments,
  normalizeSchoolProfile,
} from '@/curriculum/school'
import type { AlphabetProgress } from '@/alphabet/progress'
import { normalizeAlphabetProgress } from '@/alphabet/progress'
import type { ProgressState, RewardProgress, TableProgress } from '@/math/types'
import { normalizeTableProgress } from '@/math/tableMastery'
import { createInitialRewardProgress, normalizeRewardCycles, syncRewardDay, localDateString } from '@/reward/engine'
import { createInitialProgress } from '@/progress/repository'

type ServerReward = {
  pointsTotal?: number
  dailyDate?: string | null
  dailyPoints?: number
  goalStatus?: string
  currentCycleNumber?: number
  pendingPrize?: { cycleNumber?: number } | null
  deliveredPrizes?: Array<{ cycleNumber?: number }>
  activeCycle?: { cycleNumber?: number } | null
}

export type ServerProgressSnapshot = {
  playerId?: number
  xp?: number
  coins?: number
  bestStreak?: number
  bestChallengeScore?: number
  soundMuted?: boolean
  lastPracticeAt?: string | null
  syncEpoch?: number
  facts?: Record<string, ProgressState['facts'][string]> | object
  tables?: Record<string, Partial<TableProgress>> | object
  alphabet?: AlphabetProgress | object
  reward?: ServerReward
  crates?: {
    pending?: ProgressState['crates']['pending']
    pityWithout?: number
  }
  school?: unknown
  activityAssignments?: unknown
}

function asRecord<T>(value: unknown): Record<string, T> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, T>
}

function mapReward(server: ServerReward | undefined, today: string): RewardProgress {
  const base = createInitialRewardProgress()
  if (!server) return syncRewardDay(base, today)

  const pendingCycleNumbers: number[] = []
  if (server.pendingPrize && typeof server.pendingPrize.cycleNumber === 'number') {
    pendingCycleNumbers.push(server.pendingPrize.cycleNumber)
  }

  const deliveredCycleNumbers = Array.isArray(server.deliveredPrizes)
    ? server.deliveredPrizes
        .map((p) => p.cycleNumber)
        .filter((n): n is number => typeof n === 'number')
    : []

  const goalStatus =
    server.goalStatus === 'completed' || server.goalStatus === 'validated' || server.goalStatus === 'active'
      ? server.goalStatus
      : pendingCycleNumbers.length > 0
        ? 'completed'
        : 'active'

  const reward: RewardProgress = {
    ...base,
    pointsTotal: typeof server.pointsTotal === 'number' ? server.pointsTotal : 0,
    dailyDate: typeof server.dailyDate === 'string' ? server.dailyDate : today,
    dailyPoints: typeof server.dailyPoints === 'number' ? server.dailyPoints : 0,
    goalStatus,
    currentCycleNumber:
      typeof server.currentCycleNumber === 'number'
        ? server.currentCycleNumber
        : typeof server.activeCycle?.cycleNumber === 'number'
          ? server.activeCycle.cycleNumber
          : 1,
    pendingCycleNumbers,
    deliveredCycleNumbers,
    celebratedPendingCycles: [],
    appliedSessionIds: [],
  }

  return normalizeRewardCycles(syncRewardDay(reward, today))
}

/**
 * Convierte el snapshot oficial MySQL en ProgressState de cliente.
 * No mezcla XP/monedas locales: el servidor manda.
 */
export function mapServerProgressToState(
  snapshot: ServerProgressSnapshot,
  opts: {
    soundMuted?: boolean
    achievements?: ProgressState['achievements']
    celebratedPendingCycles?: number[]
    alphabet?: AlphabetProgress
    today?: string
  } = {},
): ProgressState {
  const today = opts.today ?? localDateString()
  const base = createInitialProgress()
  const facts = asRecord<ProgressState['facts'][string]>(snapshot.facts)
  const tablesRaw = asRecord<Partial<TableProgress>>(snapshot.tables)
  const tables: Record<string, TableProgress> = {}
  for (const [key, value] of Object.entries(tablesRaw)) {
    tables[key] = normalizeTableProgress(value)
  }

  const reward = mapReward(snapshot.reward, today)
  if (opts.celebratedPendingCycles) {
    reward.celebratedPendingCycles = opts.celebratedPendingCycles.filter((n) =>
      reward.pendingCycleNumbers.includes(n),
    )
  }

  const crates = normalizeCratesState({
    ...createInitialCratesState(),
    pityWithoutCrate: snapshot.crates?.pityWithout ?? 0,
    pending: snapshot.crates?.pending ?? null,
  })

  const alphabet = snapshot.alphabet
    ? normalizeAlphabetProgress(snapshot.alphabet)
    : normalizeAlphabetProgress(opts.alphabet)

  return {
    ...base,
    version: 5,
    xp: typeof snapshot.xp === 'number' ? snapshot.xp : 0,
    coins: typeof snapshot.coins === 'number' ? snapshot.coins : 0,
    bestStreak: typeof snapshot.bestStreak === 'number' ? snapshot.bestStreak : 0,
    bestChallengeScore:
      typeof snapshot.bestChallengeScore === 'number' ? snapshot.bestChallengeScore : 0,
    lastPracticeAt: typeof snapshot.lastPracticeAt === 'string' ? snapshot.lastPracticeAt : null,
    facts,
    tables,
    alphabet,
    soundMuted: typeof opts.soundMuted === 'boolean' ? opts.soundMuted : Boolean(snapshot.soundMuted),
    reward,
    crates,
    achievements: opts.achievements ?? { claimedIds: [] },
    school: snapshot.school
      ? normalizeSchoolProfile(snapshot.school)
      : createDefaultSchoolProfile(),
    activityAssignments: snapshot.activityAssignments
      ? normalizeActivityAssignments(snapshot.activityAssignments)
      : {},
  }
}
