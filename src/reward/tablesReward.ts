import { activityWeightDefaults, tablesActivityMeta } from '@/config/rewardGoal'
import { factKeyOf } from '@/math/tables'
import type { SessionAnswer } from '@/math/types'

/**
 * Calcula puntos de recompensa solicitados por una sesión de tablas.
 * - Solo aciertos.
 * - Una operación canónica (3×7 ≡ 7×3) solo cuenta una vez por sesión.
 * - attemptId evita contar el mismo intento dos veces.
 * - El peso por ítem es el configurado (micro = 1).
 */
export function computeTablesRewardRequest(answers: SessionAnswer[]): {
  requestedPoints: number
  creditedAttemptIds: string[]
  creditedFactKeys: string[]
} {
  const weight = tablesActivityMeta.rewardWeight
  const seenAttempts = new Set<string>()
  const creditedFacts = new Set<string>()
  const creditedAttemptIds: string[] = []
  let requested = 0

  for (const answer of answers) {
    if (!answer.correct) continue
    if (!answer.attemptId || seenAttempts.has(answer.attemptId)) continue
    seenAttempts.add(answer.attemptId)

    const key = factKeyOf(answer.fact)
    if (creditedFacts.has(key)) continue
    creditedFacts.add(key)
    creditedAttemptIds.push(answer.attemptId)
    requested += weight
  }

  return {
    requestedPoints: requested,
    creditedAttemptIds,
    creditedFactKeys: [...creditedFacts],
  }
}

export function resolveActivityWeight(
  tier: keyof typeof activityWeightDefaults,
  override?: number,
): number {
  return override ?? activityWeightDefaults[tier]
}
