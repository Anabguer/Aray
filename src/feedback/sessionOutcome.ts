import { evaluateTableRoundScore, tableRoundConfig } from '@/math/tableMastery'
import type { ProgressState, SessionAnswer, SessionResult } from '@/math/types'
import { energyCopy } from '@/config/rewardGoal'
import { levelFromXp } from '@/feedback/xpPreview'

/** Etiqueta de desbloqueo real tras una sesión (sin inventar recompensas). */
export function unlockLabelAfterSession(
  progressBefore: ProgressState,
  tables: number[],
  answers: SessionAnswer[],
  result: SessionResult,
): string | null {
  const parts: string[] = []

  for (const table of tables) {
    const prev = progressBefore.tables[String(table)]
    if (prev?.everMastered) continue
    const score = evaluateTableRoundScore(answers, table)
    if (score !== null && score >= tableRoundConfig.passScore) {
      parts.push(`Tabla del ${table} Domada`)
    }
  }

  if (result.rewardGoalJustCompleted) {
    parts.push(energyCopy.dropUnlockedFor('tu tutor'))
  }

  if (result.personalBest) {
    parts.push('Nuevo récord en Reto')
  }

  return parts[0] ?? null
}

export function sessionLeveledUp(xpBefore: number, xpEarned: number): {
  leveledUp: boolean
  newLevel: number
} {
  const before = levelFromXp(xpBefore)
  const after = levelFromXp(xpBefore + xpEarned)
  return { leveledUp: after > before, newLevel: after }
}

/** Sesión perfecta = sin respuestas incorrectas registradas. */
export function isPerfectSession(answers: SessionAnswer[]): boolean {
  return answers.length > 0 && answers.every((a) => a.correct)
}
