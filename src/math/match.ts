import { matchFactorRange } from '@/config/playConfig'
import { makeFact } from '@/math/tables'
import type { MultiplicationFact } from '@/math/types'

export interface MatchPair {
  id: string
  fact: MultiplicationFact
  label: string
  product: number
  /** Multiplicador b en `tabla × b`. */
  factor: number
}

export type MatchFactorRange = { min: number; max: number }

export function buildMatchPairs(
  table: number,
  range: MatchFactorRange = matchFactorRange,
): MatchPair[] {
  const min = Math.max(1, range.min)
  const max = Math.max(min, range.max)
  const pairs: MatchPair[] = []
  for (let b = min; b <= max; b += 1) {
    const fact = makeFact(table, b)
    pairs.push({
      id: `${table}x${b}`,
      fact,
      label: `${table} × ${b}`,
      product: fact.product,
      factor: b,
    })
  }
  return pairs
}

export function shuffleInPlace<T>(items: T[], random: () => number = Math.random): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

/** Evita que el orden de productos coincida posición a posición con las operaciones. */
export function shuffleProductsNotAligned(
  pairs: MatchPair[],
  random: () => number = Math.random,
): number[] {
  const products = pairs.map((p) => p.product)
  let guard = 0
  do {
    shuffleInPlace(products, random)
    guard += 1
  } while (guard < 20 && products.some((p, i) => p === pairs[i].product))
  return products
}

export function splitRounds(pairs: MatchPair[], roundSize = 5): MatchPair[][] {
  const rounds: MatchPair[][] = []
  for (let i = 0; i < pairs.length; i += roundSize) {
    rounds.push(pairs.slice(i, i + roundSize))
  }
  return rounds
}

/**
 * Divide la tabla en rondas compactas (máx. `maxPerRound`).
 * Preferencia: 1–5, 6–10, 11–12…; si el rango es exactamente 12, usa 4+4+4.
 */
export function buildMatchRounds(pairs: MatchPair[], maxPerRound = 5): MatchPair[][] {
  if (pairs.length === 0) return []
  if (pairs.length <= maxPerRound) return [pairs]

  const sorted = [...pairs].sort((a, b) => a.factor - b.factor)
  const minF = sorted[0].factor
  const maxF = sorted[sorted.length - 1].factor

  if (sorted.length === 12 && maxPerRound >= 4) {
    return [sorted.slice(0, 4), sorted.slice(4, 8), sorted.slice(8, 12)]
  }

  const bands: MatchPair[][] = []
  for (let start = Math.floor((minF - 1) / 5) * 5 + 1; start <= maxF; start += 5) {
    const end = start + 4
    const band = sorted.filter((p) => p.factor >= start && p.factor <= end)
    if (band.length === 0) continue
    for (let i = 0; i < band.length; i += maxPerRound) {
      bands.push(band.slice(i, i + maxPerRound))
    }
  }
  return bands.length > 0 ? bands : splitRounds(sorted, maxPerRound)
}

export function isCorrectMatch(pair: MatchPair, product: number): boolean {
  return pair.product === product
}

/** Pistas progresivas: null en el 1.er fallo (solo mensaje genérico). */
export function matchHintForAttempt(
  table: number,
  product: number,
  attemptCount: number,
): string | null {
  if (attemptCount < 2) return null
  if (attemptCount === 2) return `Piensa en la tabla del ${table}`
  let low = Math.floor((product - 1) / 10) * 10
  let high = low + 10
  if (product % 10 === 0) {
    low = product - 5
    high = product + 5
  }
  if (low < 0) low = 0
  return `Es mayor que ${low} y menor que ${high}`
}

export const MATCH_WRONG_MESSAGE = 'Ahí no… prueba otra vez'
export const MATCH_MAX_PER_ROUND = 5
