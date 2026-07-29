import { makeFact } from './tables'
import type { MultiplicationFact } from './types'

function shuffleInPlace<T>(items: T[], random: () => number = Math.random): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

/** Genera exactamente 4 opciones únicas incluyendo el producto correcto. */
export function buildAnswerOptions(
  fact: MultiplicationFact,
  random: () => number = Math.random,
): number[] {
  const correct = fact.product
  const candidates = new Set<number>([correct])

  const push = (n: number) => {
    if (n > 0 && n !== correct) candidates.add(n)
  }

  push(fact.a * (fact.b + 1))
  push(fact.a * (fact.b - 1))
  push((fact.a + 1) * fact.b)
  push((fact.a - 1) * fact.b)
  push(correct + fact.a)
  push(correct - fact.a)
  push(correct + fact.b)
  push(correct - fact.b)
  push(fact.a + fact.b)
  push(Math.abs(fact.a - fact.b) || 1)

  let guard = 0
  while (candidates.size < 4 && guard < 40) {
    const jitter = Math.floor(random() * 12) + 1
    push(correct + jitter)
    push(Math.max(1, correct - jitter))
    guard += 1
  }

  const unique = [...candidates]
  const distractors = shuffleInPlace(
    unique.filter((n) => n !== correct),
    random,
  ).slice(0, 3)

  while (distractors.length < 3) {
    const filler = correct + distractors.length + 2
    if (!distractors.includes(filler) && filler !== correct) distractors.push(filler)
    else distractors.push(filler + 10)
  }

  return shuffleInPlace([correct, ...distractors.slice(0, 3)], random)
}

export function hasUniqueOptions(options: number[]): boolean {
  return new Set(options).size === options.length && options.length === 4
}

export function pickDisplayFact(
  a: number,
  b: number,
  preferredTable: number | null,
  random: () => number = Math.random,
): MultiplicationFact {
  if (preferredTable !== null && (a === preferredTable || b === preferredTable)) {
    const other = a === preferredTable ? b : a
    return makeFact(preferredTable, other)
  }
  return random() < 0.5 ? makeFact(a, b) : makeFact(b, a)
}
