import { normalizeAlphabetProgress, emptyAlphabetProgress } from '@/alphabet/progress'
import { createEmptyStats, normalizeStats } from '@/achievements/stats'
import { challengeModeConfig } from '@/config/playConfig'
import { missionEnergyConfig, rewardGoalConfig } from '@/config/rewardGoal'
import { rewardRules } from '@/config/rewards'
import { createInitialCratesState, normalizeCratesState } from '@/crates/engine'
import {
  createDefaultSchoolProfile,
  normalizeActivityAssignments,
  normalizeSchoolProfile,
} from '@/curriculum/school'
import {
  advanceMissionProgress,
  challengeEnergyIfAvailable,
  loadDailyMissionSnapshot,
  markChallengeDone,
  remainingMissionUnits,
} from '@/daily/missionEnergy'
import { computeMasteryScore, emptyFactStats, emptyTableProgress } from '@/math/selector'
import {
  applyEvaluableRound,
  bumpTableAttempt,
  evaluateTableRoundScore,
  normalizeTableProgress,
} from '@/math/tableMastery'
import { factKeyOf } from '@/math/tables'
import type { ProgressState, SessionAnswer, SessionResult, TableProgress } from '@/math/types'
import {
  createInitialRewardProgress,
  grantRewardPoints,
  localDateString,
  normalizeRewardCycles,
  syncRewardDay,
} from '@/reward/engine'
import { computeTablesRewardRequest } from '@/reward/tablesReward'

export const PROGRESS_STORAGE_KEY = 'aray.progress.v1'

export function createInitialProgress(): ProgressState {
  return {
    version: 6,
    xp: 0,
    coins: 0,
    bestStreak: 0,
    bestChallengeScore: 0,
    lastPracticeAt: null,
    facts: {},
    tables: {},
    soundMuted: false,
    reward: createInitialRewardProgress(),
    crates: createInitialCratesState(),
    achievements: { claimedIds: [] },
    stats: createEmptyStats(),
    school: createDefaultSchoolProfile(),
    activityAssignments: {},
    alphabet: emptyAlphabetProgress(),
  }
}

/** Escala energía ×10 al migrar desde meta 500 / tope 10. */
const ENERGY_VISUAL_SCALE = 10

/** Normaliza / migra cualquier progreso guardado (v1…v5 → v6 con energía escalada). */
export function normalizeProgress(raw: unknown, today: string = localDateString()): ProgressState {
  const base = createInitialProgress()
  if (!raw || typeof raw !== 'object') return base

  const parsed = raw as Partial<ProgressState> & { version?: number; reward?: Partial<ProgressState['reward']> }
  const fromVersion = typeof parsed.version === 'number' ? parsed.version : 1

  const reward = {
    ...createInitialRewardProgress(),
    ...(parsed.reward ?? {}),
    appliedSessionIds: Array.isArray(parsed.reward?.appliedSessionIds)
      ? parsed.reward!.appliedSessionIds.filter((id): id is string => typeof id === 'string')
      : [],
  }

  let pointsTotal =
    typeof parsed.reward?.pointsTotal === 'number' ? parsed.reward.pointsTotal : 0
  let dailyPoints =
    typeof parsed.reward?.dailyPoints === 'number' ? parsed.reward.dailyPoints : 0

  // v5 e inferiores guardaban energía en escala 500/10.
  if (fromVersion < 6) {
    pointsTotal *= ENERGY_VISUAL_SCALE
    dailyPoints *= ENERGY_VISUAL_SCALE
  }

  const merged: ProgressState = {
    ...base,
    xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
    coins: typeof parsed.coins === 'number' ? parsed.coins : 0,
    bestStreak: typeof parsed.bestStreak === 'number' ? parsed.bestStreak : 0,
    bestChallengeScore: typeof parsed.bestChallengeScore === 'number' ? parsed.bestChallengeScore : 0,
    lastPracticeAt: typeof parsed.lastPracticeAt === 'string' ? parsed.lastPracticeAt : null,
    facts: parsed.facts && typeof parsed.facts === 'object' ? parsed.facts : {},
    tables: normalizeTablesMap(parsed.tables),
    soundMuted: Boolean(parsed.soundMuted),
    reward: syncRewardDay(reward, today),
    crates: normalizeCratesState((parsed as { crates?: unknown }).crates),
    achievements: {
      claimedIds: Array.isArray((parsed as Partial<ProgressState>).achievements?.claimedIds)
        ? (parsed as Partial<ProgressState>).achievements!.claimedIds.filter(
            (id): id is string => typeof id === 'string',
          )
        : [],
    },
    stats: normalizeStats((parsed as { stats?: unknown }).stats),
    school: normalizeSchoolProfile((parsed as { school?: unknown }).school),
    activityAssignments: normalizeActivityAssignments(
      (parsed as { activityAssignments?: unknown }).activityAssignments,
    ),
    alphabet: normalizeAlphabetProgress((parsed as { alphabet?: unknown }).alphabet),
    version: 6,
  }

  // No convertir monedas en puntos de recompensa
  merged.reward.pointsTotal = Math.min(
    rewardGoalConfig.targetPoints,
    Math.max(0, pointsTotal),
  )
  merged.reward.dailyPoints = Math.min(
    rewardGoalConfig.dailyCap,
    Math.max(0, dailyPoints),
  )
  merged.reward = normalizeRewardCycles(merged.reward)

  return merged
}

function normalizeTablesMap(raw: unknown): Record<string, TableProgress> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, TableProgress> = {}
  for (const [key, value] of Object.entries(raw as Record<string, Partial<TableProgress>>)) {
    out[key] = normalizeTableProgress(value)
  }
  return out
}

export interface ProgressStore {
  load(): ProgressState
  save(state: ProgressState): void
  clear(): void
}

export function createLocalStorageProgressStore(
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = localStorage,
  key: string = PROGRESS_STORAGE_KEY,
  now: () => Date = () => new Date(),
): ProgressStore {
  return {
    load() {
      try {
        const raw = storage.getItem(key)
        if (!raw) return createInitialProgress()
        return normalizeProgress(JSON.parse(raw), localDateString(now()))
      } catch {
        return createInitialProgress()
      }
    },
    save(state) {
      storage.setItem(key, JSON.stringify({ ...state, version: 6 }))
    },
    clear() {
      storage.removeItem(key)
    },
  }
}

export function bumpWeightOnWrong(weight: number): number {
  return Math.min(12, weight + 2.5)
}

export function bumpWeightOnCorrect(weight: number): number {
  return Math.max(0.5, weight * 0.7)
}

export function calculateSessionRewards(
  mode: SessionResult['mode'],
  answers: SessionAnswer[],
  previousBestChallenge: number,
  score: number,
  multipliers: { xpMultiplier?: number; coinMultiplier?: number } = {},
): { xpEarned: number; coinsEarned: number; bestStreak: number; personalBest: boolean } {
  const xpMult = multipliers.xpMultiplier ?? 1
  let xp = 0
  let streak = 0
  let bestStreak = 0

  for (const answer of answers) {
    if (answer.correct) {
      const firstTry = answer.firstTry ?? true
      xp += rewardRules.xpPerCorrect * xpMult
      if (firstTry) {
        streak += 1
        bestStreak = Math.max(bestStreak, streak)
        if (streak > 0 && streak % rewardRules.xpStreakBonusEvery === 0) {
          xp += rewardRules.xpStreakBonus * xpMult
        }
      } else {
        streak = 0
      }
    } else {
      streak = 0
    }
  }

  const personalBest = mode === 'challenge' && score > previousBestChallenge
  // Economía sin monedas: coinsEarned siempre 0 (campo API/compat).
  return { xpEarned: xp, coinsEarned: 0, bestStreak, personalBest }
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

export function applySessionToProgress(
  progress: ProgressState,
  partial: Omit<
    SessionResult,
    | 'xpEarned'
    | 'coinsEarned'
    | 'personalBest'
    | 'missedFacts'
    | 'rewardPointsEarned'
    | 'rewardPointsRequested'
    | 'rewardDailyComplete'
    | 'rewardGoalJustCompleted'
    | 'rewardDailyPoints'
    | 'rewardPointsTotal'
  > & {
    missedFacts?: SessionResult['missedFacts']
    sessionId: string
  },
  today: string = localDateString(),
  opts?: { playerId?: number | null; isMissionOfDay?: boolean },
): { next: ProgressState; result: SessionResult } {
  // Sesión ya aplicada: no duplicar XP/monedas/recompensa
  if (progress.reward.appliedSessionIds.includes(partial.sessionId)) {
    const emptyResult: SessionResult = {
      mode: partial.mode,
      tables: partial.tables,
      answers: partial.answers,
      score: partial.score,
      bestStreak: 0,
      xpEarned: 0,
      coinsEarned: 0,
      personalBest: false,
      missedFacts: partial.missedFacts ?? [],
      sessionId: partial.sessionId,
      rewardPointsEarned: 0,
      rewardPointsRequested: 0,
      rewardDailyComplete: progress.reward.dailyPoints >= rewardGoalConfig.dailyCap || progress.reward.goalStatus !== 'active',
      rewardGoalJustCompleted: false,
      rewardDailyPoints: progress.reward.dailyPoints,
      rewardPointsTotal: progress.reward.pointsTotal,
    }
    return { next: progress, result: emptyResult }
  }

  const rewards = calculateSessionRewards(
    partial.mode,
    partial.answers,
    progress.bestChallengeScore,
    partial.score,
    partial.mode === 'challenge'
      ? {
          xpMultiplier: challengeModeConfig.xpMultiplier,
          coinMultiplier: challengeModeConfig.coinMultiplier,
        }
      : {},
  )

  const playerId = opts?.playerId ?? null
  const mission = loadDailyMissionSnapshot(playerId, today)
  const tablesRemaining = remainingMissionUnits('tables', mission.progress)
  // +10 del Reto del día (card aleatoria del lobby), no del modo Reto rápido de tablas.
  const challengeBonus = opts?.isMissionOfDay
    ? challengeEnergyIfAvailable(mission)
    : 0

  const rewardRequest =
    partial.mode === 'learn'
      ? {
          requestedPoints: 0,
          creditedAttemptIds: [] as string[],
          creditedFactKeys: [] as string[],
          unitsCredited: 0,
        }
      : (() => {
          const base = computeTablesRewardRequest(partial.answers, {
            maxUnits: tablesRemaining,
            weight: missionEnergyConfig.perUnit.tables,
          })
          const mult =
            partial.mode === 'challenge' ? challengeModeConfig.rewardMultiplier : 1
          return {
            ...base,
            requestedPoints: Math.round(base.requestedPoints * mult) + challengeBonus,
          }
        })()

  const grant = grantRewardPoints(
    progress.reward,
    {
      requestedPoints: rewardRequest.requestedPoints,
      sessionId: partial.sessionId,
      attemptIds: rewardRequest.creditedAttemptIds,
    },
    today,
  )

  if (rewardRequest.unitsCredited > 0) {
    advanceMissionProgress(playerId, 'tables', rewardRequest.unitsCredited, today)
  }

  if (challengeBonus > 0 && grant.granted > rewardRequest.requestedPoints - challengeBonus) {
    markChallengeDone(playerId, today)
  }

  const next: ProgressState = {
    ...progress,
    version: 6,
    facts: { ...progress.facts },
    tables: { ...progress.tables },
    alphabet: normalizeAlphabetProgress(progress.alphabet),
    school: progress.school ?? createDefaultSchoolProfile(),
    activityAssignments: progress.activityAssignments ?? {},
    xp: progress.xp + rewards.xpEarned,
    coins: progress.coins,
    bestStreak: Math.max(progress.bestStreak, rewards.bestStreak),
    lastPracticeAt: new Date().toISOString(),
    reward: grant.reward,
  }

  if (partial.mode === 'challenge') {
    next.bestChallengeScore = Math.max(progress.bestChallengeScore, partial.score)
  }

  const now = next.lastPracticeAt!

  for (const answer of partial.answers) {
    const key = factKeyOf(answer.fact)
    const prev = next.facts[key] ?? emptyFactStats()
    const updated = {
      ...prev,
      attempts: prev.attempts + 1,
      correct: prev.correct + (answer.correct ? 1 : 0),
      wrong: prev.wrong + (answer.correct ? 0 : 1),
      weight: answer.correct ? bumpWeightOnCorrect(prev.weight) : bumpWeightOnWrong(prev.weight),
      lastSeenAt: now,
    }
    next.facts[key] = updated

    if (answer.fact.a >= 1 && answer.fact.a <= 10) {
      const tKey = String(answer.fact.a)
      const tPrev = normalizeTableProgress(next.tables[tKey] ?? emptyTableProgress())
      next.tables[tKey] = bumpTableAttempt(tPrev, answer.correct, now, computeMasteryScore)
    }
  }

  // Rondas evaluables por tabla (Entrena / Empareja / Reto con volumen suficiente)
  const tablesTouched = new Set(
    partial.answers.map((a) => a.fact.a).filter((n) => n >= 1 && n <= 10),
  )
  for (const tableNum of tablesTouched) {
    const roundScore = evaluateTableRoundScore(partial.answers, tableNum)
    if (roundScore === null) continue
    const tKey = String(tableNum)
    const tPrev = normalizeTableProgress(next.tables[tKey] ?? emptyTableProgress())
    next.tables[tKey] = applyEvaluableRound(tPrev, roundScore)
  }

  const missedFacts =
    partial.missedFacts ??
    partial.answers
      .filter((a) => !a.correct)
      .map((a) => a.fact)
      .filter((fact, index, arr) => arr.findIndex((f) => factKeyOf(f) === factKeyOf(fact)) === index)

  const result: SessionResult = {
    mode: partial.mode,
    tables: partial.tables,
    answers: partial.answers,
    score: partial.score,
    bestStreak: rewards.bestStreak,
    xpEarned: rewards.xpEarned,
    coinsEarned: rewards.coinsEarned,
    personalBest: rewards.personalBest,
    missedFacts,
    sessionId: partial.sessionId,
    rewardPointsEarned: grant.granted,
    rewardPointsRequested: grant.requested,
    rewardDailyComplete: grant.dailyComplete,
    rewardGoalJustCompleted: grant.goalJustCompleted,
    rewardDailyPoints: grant.reward.dailyPoints,
    rewardPointsTotal: grant.reward.pointsTotal,
  }

  return { next, result }
}
