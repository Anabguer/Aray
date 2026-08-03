import { MIX_TABLES, PLAYABLE_TABLES } from '@/config/playConfig'
import { challengeDurationSec, masteryThresholds, trainQuestionCount } from '@/config/rewards'
import { buildAnswerOptions, pickDisplayFact } from './options'
import { tableStatus } from './tableMastery'
import { factKey, factKeyOf, factsForTables, makeFact } from './tables'
import type {
  FactKey,
  FactStats,
  MasteryLevel,
  MultiplicationFact,
  ProgressState,
  QuestionCard,
  TableProgress,
} from './types'

export { emptyTableProgress } from './tableMastery'

/** Tope de la misma operación (7×9 ≡ 9×7) por ronda de entreno. */
export const maxSameFactPerQueue = 2

export function emptyFactStats(): FactStats {
  return { attempts: 0, correct: 0, wrong: 0, weight: 1, lastSeenAt: null }
}

export function masteryLevel(score: number): MasteryLevel {
  if (score >= masteryThresholds.mastered) return 'mastered'
  if (score >= masteryThresholds.solid) return 'solid'
  if (score >= masteryThresholds.learning) return 'learning'
  return 'new'
}

export function masteryLabel(level: MasteryLevel): string {
  switch (level) {
    case 'mastered':
      return '¡Domada!'
    case 'solid':
      return 'Sólida'
    case 'learning':
      return 'En marcha'
    default:
      return 'Nueva'
  }
}

/** Etiqueta visible de dominio (incluye repaso y necesita entreno). */
export function tableMasteryLabel(table: TableProgress): string {
  return tableStatus(table).label
}

export function tableMasteryLevel(table: TableProgress): MasteryLevel {
  return tableStatus(table).level
}

function weightOf(progress: ProgressState, key: FactKey): number {
  return progress.facts[key]?.weight ?? 1
}

/** Una entrada por clave canónica (evita doblar peso 7×9 y 9×7 en mezcla). */
export function uniqueFactsByKey(pool: MultiplicationFact[]): MultiplicationFact[] {
  const seen = new Set<FactKey>()
  const out: MultiplicationFact[] = []
  for (const fact of pool) {
    const key = factKeyOf(fact)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(fact)
  }
  return out
}

type PickOpts = {
  seenCounts?: Map<FactKey, number>
  maxSeen?: number
}

/**
 * Selección ponderada: más peso = más probabilidad (fallos recientes).
 * Evita repetir la misma clave canónica de forma consecutiva y respeta tope por ronda.
 */
export function pickNextFact(
  pool: MultiplicationFact[],
  progress: ProgressState,
  lastKey: FactKey | null,
  random: () => number = Math.random,
  opts: PickOpts = {},
): MultiplicationFact {
  if (pool.length === 0) {
    throw new Error('Pool de multiplicaciones vacío')
  }

  const maxSeen = opts.maxSeen ?? Number.POSITIVE_INFINITY
  const seen = opts.seenCounts

  const filterPool = (relaxCap: boolean) =>
    pool.filter((f) => {
      const key = factKeyOf(f)
      if (key === lastKey) return false
      if (!relaxCap && seen && (seen.get(key) ?? 0) >= maxSeen) return false
      return true
    })

  let usable = filterPool(false)
  if (usable.length === 0) usable = filterPool(true)
  if (usable.length === 0) usable = pool

  const weights = usable.map((f) => Math.max(0.25, weightOf(progress, factKeyOf(f))))
  const total = weights.reduce((sum, w) => sum + w, 0)
  let ticket = random() * total

  for (let i = 0; i < usable.length; i += 1) {
    ticket -= weights[i]!
    if (ticket <= 0) return usable[i]!
  }
  return usable[usable.length - 1]!
}

export function toQuestionCard(
  fact: MultiplicationFact,
  preferredTable: number | null = null,
  random: () => number = Math.random,
): QuestionCard {
  const display =
    preferredTable !== null
      ? pickDisplayFact(fact.a, fact.b, preferredTable, random)
      : pickDisplayFact(fact.a, fact.b, null, random)
  return {
    fact: display,
    options: buildAnswerOptions(display, random),
  }
}

function buildWeightedQueue(
  pool: MultiplicationFact[],
  progress: ProgressState,
  count: number,
  preferredTable: number | null,
  random: () => number,
): QuestionCard[] {
  const uniquePool = uniqueFactsByKey(pool)
  const queue: QuestionCard[] = []
  let lastKey: FactKey | null = null
  const seenCounts = new Map<FactKey, number>()
  const maxSeen = Math.max(1, maxSameFactPerQueue)

  for (let i = 0; i < count; i += 1) {
    const fact = pickNextFact(uniquePool, progress, lastKey, random, {
      seenCounts,
      maxSeen,
    })
    const key = factKeyOf(fact)
    lastKey = key
    seenCounts.set(key, (seenCounts.get(key) ?? 0) + 1)
    queue.push(toQuestionCard(fact, preferredTable, random))
  }
  return queue
}

export function buildTrainQueue(
  tables: number[],
  progress: ProgressState,
  count: number = trainQuestionCount,
  random: () => number = Math.random,
): QuestionCard[] {
  const preferred = tables.length === 1 ? tables[0]! : null
  return buildWeightedQueue(factsForTables(tables), progress, count, preferred, random)
}

/** Inserta un reintento más adelante (no inmediatamente). */
export function scheduleRetry(
  remaining: QuestionCard[],
  failed: MultiplicationFact,
  random: () => number = Math.random,
): QuestionCard[] {
  const card = toQuestionCard(failed, null, random)
  if (remaining.length === 0) return [card]
  const minIndex = 1
  const index = Math.min(
    remaining.length,
    minIndex + Math.floor(random() * Math.max(1, remaining.length - minIndex + 1)),
  )
  const next = [...remaining]
  next.splice(index, 0, card)
  return next
}

function padMissesPool(missed: MultiplicationFact[]): MultiplicationFact[] {
  if (missed.length >= 5) return missed
  const tables = [
    ...new Set(
      missed.flatMap((f) => [f.a, f.b]).filter((n) => PLAYABLE_TABLES.includes(n as (typeof PLAYABLE_TABLES)[number])),
    ),
  ]
  const padTables = tables.length > 0 ? tables : [...MIX_TABLES]
  const missedKeys = new Set(missed.map(factKeyOf))
  const pad = uniqueFactsByKey(factsForTables(padTables)).filter((f) => !missedKeys.has(factKeyOf(f)))
  return [...missed, ...pad]
}

export function buildMissesQueue(
  progress: ProgressState,
  count: number = trainQuestionCount,
  random: () => number = Math.random,
): { queue: QuestionCard[]; usedFallbackMix: boolean } {
  const missed = Object.entries(progress.facts)
    .filter(([, stats]) => stats.wrong > 0)
    .sort((a, b) => b[1].weight - a[1].weight || b[1].wrong - a[1].wrong)

  if (missed.length === 0) {
    return {
      queue: buildTrainQueue(MIX_TABLES, progress, count, random),
      usedFallbackMix: true,
    }
  }

  const core: MultiplicationFact[] = missed.map(([key]) => {
    const [lo, hi] = key.split('x').map(Number)
    return makeFact(lo!, hi!)
  })

  return {
    queue: buildWeightedQueue(padMissesPool(core), progress, count, null, random),
    usedFallbackMix: false,
  }
}

export function computeMasteryScore(correct: number, attempts: number): number {
  if (attempts === 0) return 0
  const accuracy = correct / attempts
  const volume = Math.min(1, attempts / 20)
  return Math.round(accuracy * 70 + volume * 30)
}

export { challengeDurationSec, trainQuestionCount, factKey, factsForTables }
