import { masteryThresholds } from '@/config/rewards'
import { factKeyOf } from '@/math/tables'
import type { MasteryLevel, SessionAnswer, TableProgress } from '@/math/types'

/** Ronda evaluable: al menos 8 operaciones distintas; meta 8/10 a la primera. */
export const tableRoundConfig = {
  targetSize: 10,
  minEvaluable: 8,
  passScore: 8,
  consecutiveLowsToNeedsTrain: 2,
} as const

export type TableStatusKind =
  | 'new'
  | 'learning'
  | 'solid'
  | 'mastered'
  | 'mastered_review'
  | 'needs_train'

export interface TableStatusView {
  kind: TableStatusKind
  label: string
  recommendPractice: boolean
  /** Nivel visual legacy (chips / barra). */
  level: MasteryLevel
}

export function emptyTableProgress(): TableProgress {
  return {
    practiced: false,
    attempts: 0,
    correct: 0,
    masteryScore: 0,
    lastPracticedAt: null,
    bestRoundScore: 0,
    lastRoundScore: null,
    consecutiveLowRounds: 0,
    everMastered: false,
  }
}

/** Migra tablas antiguas sin campos de ronda. */
export function normalizeTableProgress(raw: Partial<TableProgress> | null | undefined): TableProgress {
  const base = emptyTableProgress()
  if (!raw || typeof raw !== 'object') return base

  const bestRoundScore =
    typeof raw.bestRoundScore === 'number'
      ? clampScore(raw.bestRoundScore)
      : typeof raw.masteryScore === 'number' && raw.masteryScore >= masteryThresholds.mastered
        ? tableRoundConfig.passScore
        : 0

  const everMastered = Boolean(raw.everMastered) || bestRoundScore >= tableRoundConfig.passScore

  return {
    practiced: Boolean(raw.practiced),
    attempts: typeof raw.attempts === 'number' ? Math.max(0, raw.attempts) : 0,
    correct: typeof raw.correct === 'number' ? Math.max(0, raw.correct) : 0,
    masteryScore: typeof raw.masteryScore === 'number' ? Math.max(0, Math.min(100, raw.masteryScore)) : 0,
    lastPracticedAt: typeof raw.lastPracticedAt === 'string' ? raw.lastPracticedAt : null,
    bestRoundScore,
    lastRoundScore: typeof raw.lastRoundScore === 'number' ? clampScore(raw.lastRoundScore) : null,
    consecutiveLowRounds:
      typeof raw.consecutiveLowRounds === 'number' ? Math.max(0, raw.consecutiveLowRounds) : 0,
    everMastered,
  }
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(tableRoundConfig.targetSize, Math.round(n)))
}

/**
 * Puntuación /10 a la primera para una tabla en la sesión.
 * null = ronda no evaluable (pocas operaciones de esa tabla).
 */
export function evaluateTableRoundScore(
  answers: SessionAnswer[],
  table: number,
): number | null {
  const forTable = answers.filter((a) => a.fact.a === table)
  if (forTable.length === 0) return null

  const byFact = new Map<string, SessionAnswer[]>()
  for (const answer of forTable) {
    const key = factKeyOf(answer.fact)
    const list = byFact.get(key) ?? []
    list.push(answer)
    byFact.set(key, list)
  }

  if (byFact.size < tableRoundConfig.minEvaluable) return null

  let firstTryCorrect = 0
  for (const tries of byFact.values()) {
    const wonFirst = tries.some((a) => a.correct && (a.firstTry ?? true))
    if (wonFirst) firstTryCorrect += 1
  }

  // Escala a /10 si la ronda no tiene exactamente 10 operaciones.
  const scaled = (firstTryCorrect / byFact.size) * tableRoundConfig.targetSize
  return clampScore(scaled)
}

/** Aplica una ronda evaluable: conserva Domada histórica y gestiona repaso / democión. */
export function applyEvaluableRound(prev: TableProgress, roundScore: number): TableProgress {
  const score = clampScore(roundScore)
  const passed = score >= tableRoundConfig.passScore
  const bestRoundScore = Math.max(prev.bestRoundScore, score)
  const everMastered = prev.everMastered || bestRoundScore >= tableRoundConfig.passScore

  let consecutiveLowRounds = prev.consecutiveLowRounds
  if (passed) consecutiveLowRounds = 0
  else consecutiveLowRounds = prev.consecutiveLowRounds + 1

  // Barra: no baja del umbral de Domada si alguna vez se dominó.
  const floor = everMastered ? masteryThresholds.mastered : 0
  const masteryScore = Math.max(prev.masteryScore, bestRoundScore * 10, floor)

  return {
    ...prev,
    practiced: true,
    bestRoundScore,
    lastRoundScore: score,
    consecutiveLowRounds,
    everMastered,
    masteryScore: Math.min(100, masteryScore),
  }
}

export function tableStatus(t: TableProgress): TableStatusView {
  const ever = t.everMastered || t.bestRoundScore >= tableRoundConfig.passScore

  if (t.consecutiveLowRounds >= tableRoundConfig.consecutiveLowsToNeedsTrain) {
    return {
      kind: 'needs_train',
      label: 'Necesita entreno',
      recommendPractice: true,
      level: 'learning',
    }
  }

  if (ever && t.consecutiveLowRounds >= 1) {
    return {
      kind: 'mastered_review',
      label: 'Domada · Conviene repasar',
      recommendPractice: true,
      level: 'mastered',
    }
  }

  if (ever) {
    return {
      kind: 'mastered',
      label: '¡Domada!',
      recommendPractice: false,
      level: 'mastered',
    }
  }

  const score = t.masteryScore
  if (score >= masteryThresholds.solid) {
    return { kind: 'solid', label: 'Sólida', recommendPractice: false, level: 'solid' }
  }
  if (score >= masteryThresholds.learning) {
    return { kind: 'learning', label: 'En marcha', recommendPractice: false, level: 'learning' }
  }
  if (t.practiced) {
    return { kind: 'learning', label: 'En marcha', recommendPractice: false, level: 'learning' }
  }
  return { kind: 'new', label: 'Sin practicar', recommendPractice: false, level: 'new' }
}

/** Actualiza intentos acumulados sin degradar Domada histórica. */
export function bumpTableAttempt(
  prev: TableProgress,
  correct: boolean,
  now: string,
  computeMasteryScore: (correct: number, attempts: number) => number,
): TableProgress {
  const attempts = prev.attempts + 1
  const correctCount = prev.correct + (correct ? 1 : 0)
  const rawScore = computeMasteryScore(correctCount, attempts)
  const ever = prev.everMastered || prev.bestRoundScore >= tableRoundConfig.passScore
  const masteryScore = ever
    ? Math.max(prev.masteryScore, rawScore, masteryThresholds.mastered)
    : Math.max(prev.masteryScore, rawScore)

  return {
    ...prev,
    practiced: true,
    attempts,
    correct: correctCount,
    masteryScore: Math.min(100, masteryScore),
    lastPracticedAt: now,
  }
}
