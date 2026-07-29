import type { FactKey, MultiplicationFact, TableNumber } from './types'

export const ALL_TABLES: TableNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export function makeFact(a: number, b: number): MultiplicationFact {
  return { a, b, product: a * b }
}

/** Orden estable menor×mayor para equivalencia 3×7 ≡ 7×3. */
export function factKey(a: number, b: number): FactKey {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  return `${lo}x${hi}`
}

export function factKeyOf(fact: MultiplicationFact): FactKey {
  return factKey(fact.a, fact.b)
}

export function formatFact(fact: MultiplicationFact): string {
  return `${fact.a} × ${fact.b}`
}

/** Todas las operaciones de las tablas elegidas (a = tabla, b = 1..10). */
export function factsForTables(tables: number[]): MultiplicationFact[] {
  const unique = [...new Set(tables)].filter((t) => t >= 1 && t <= 10).sort((x, y) => x - y)
  const facts: MultiplicationFact[] = []
  for (const a of unique) {
    for (let b = 1; b <= 10; b += 1) {
      facts.push(makeFact(a, b))
    }
  }
  return facts
}

export function displayOrientation(table: number, other: number): MultiplicationFact {
  return makeFact(table, other)
}
