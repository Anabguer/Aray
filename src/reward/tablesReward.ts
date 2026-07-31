import { activityWeightDefaults, tablesActivityMeta } from '@/config/rewardGoal'
import { factKeyOf } from '@/math/tables'
import type { SessionAnswer } from '@/math/types'

/**
 * Calcula puntos de recompensa solicitados por una sesión de tablas.
 * - Solo aciertos.
 * - Una operación canónica (3×7 ≡ 7×3) solo cuenta una vez por sesión.
 * - attemptId evita contar el mismo intento dos veces.
 * - maxUnits limita a slots restantes de la misión del día.
 */
export function computeTablesRewardRequest(
  answers: SessionAnswer[],
  options?: { maxUnits?: number; weight?: number },
): {
  requestedPoints: number
  creditedAttemptIds: string[]
  creditedFactKeys: string[]
  unitsCredited: number
} {
  const weight = options?.weight ?? tablesActivityMeta.rewardWeight
  const maxUnits =
    options?.maxUnits == null ? Number.POSITIVE_INFINITY : Math.max(0, Math.floor(options.maxUnits))
  const seenAttempts = new Set<string>()
  const creditedFacts = new Set<string>()
  const creditedAttemptIds: string[] = []
  let unitsCredited = 0
  let requested = 0

  for (const answer of answers) {
    if (unitsCredited >= maxUnits) break
    if (!answer.correct) continue
    if (!answer.attemptId || seenAttempts.has(answer.attemptId)) continue
    seenAttempts.add(answer.attemptId)

    const key = factKeyOf(answer.fact)
    if (creditedFacts.has(key)) continue
    creditedFacts.add(key)
    creditedAttemptIds.push(answer.attemptId)
    unitsCredited += 1
    requested += weight
  }

  return {
    requestedPoints: requested,
    creditedAttemptIds,
    creditedFactKeys: [...creditedFacts],
    unitsCredited,
  }
}

export function resolveActivityWeight(
  tier: keyof typeof activityWeightDefaults,
  override?: number,
): number {
  return override ?? activityWeightDefaults[tier]
}
