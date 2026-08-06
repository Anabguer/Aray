import { PLAYABLE_TABLES } from '@/config/playConfig'
import { tableStatus } from '@/math/tableMastery'
import type { ProgressState } from '@/math/types'

export type DailyMissionTablesPick =
  | { kind: 'train'; table: number }
  | { kind: 'misses' }

type WeightedPick = DailyMissionTablesPick & { weight: number }

/**
 * Elige una misión de tablas sesgada a lo que más cuesta:
 * tablas con recommendPractice, sin practicar, o «Mis fallos» si hay wrongs.
 * Si no hay debilidad clara, cae a cualquier tabla jugable.
 */
export function listDailyMissionTablesCandidates(progress: ProgressState): WeightedPick[] {
  const out: WeightedPick[] = []

  for (const n of PLAYABLE_TABLES) {
    const table = progress.tables[String(n)]
    if (!table) {
      out.push({ kind: 'train', table: n, weight: 10 })
      continue
    }
    const status = tableStatus(table)
    if (status.recommendPractice) {
      out.push({
        kind: 'train',
        table: n,
        weight: 40 + table.consecutiveLowRounds * 28 + Math.max(0, 8 - (table.lastRoundScore ?? 0)) * 4,
      })
    } else if (!table.practiced) {
      out.push({ kind: 'train', table: n, weight: 12 })
    } else {
      out.push({ kind: 'train', table: n, weight: 4 })
    }
  }

  let totalWrong = 0
  for (const stats of Object.values(progress.facts)) {
    totalWrong += stats.wrong
  }
  if (totalWrong > 0) {
    out.push({
      kind: 'misses',
      weight: 25 + Math.min(90, totalWrong * 6),
    })
  }

  return out
}

export function pickDailyMissionTables(
  progress: ProgressState,
  random: () => number = Math.random,
): DailyMissionTablesPick {
  const candidates = listDailyMissionTablesCandidates(progress)
  const total = candidates.reduce((s, c) => s + c.weight, 0)
  let roll = random() * total
  for (const c of candidates) {
    roll -= c.weight
    if (roll <= 0) {
      return c.kind === 'misses' ? { kind: 'misses' } : { kind: 'train', table: c.table }
    }
  }
  const last = candidates[candidates.length - 1]!
  return last.kind === 'misses' ? { kind: 'misses' } : { kind: 'train', table: last.table }
}
