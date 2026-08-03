/**
 * Varios: tableros Empareja (quién hace qué / común↔propio).
 */
import { listVariosParesItems } from '@/feinetas/wordsBanks'
import type { WordsVariosKind } from '@/feinetas/wordsVariosParesPack'

export const VARIOS_ROUNDS = 5
export const VARIOS_PAIR_COUNT = 4

export type VariosProductId = 'quien-hace-que' | 'comun-propio'

export type VariosBoard = {
  id: string
  productId: VariosProductId
  prompt: string
  help: string
  pairs: { id: string; left: string; right: string }[]
  rightOrder: string[]
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

function kindFor(productId: VariosProductId): WordsVariosKind {
  return productId === 'quien-hace-que' ? 'pronoun-verb' : 'common-proper'
}

export function buildVariosBoard(
  productId: VariosProductId,
  seed: number,
  pairCount = VARIOS_PAIR_COUNT,
): VariosBoard {
  const kind = kindFor(productId)
  const random = mulberry32(seed)
  const pool = shuffle(listVariosParesItems(kind), random)
  // Prefer unique left labels when possible
  const picked: typeof pool = []
  const usedLeft = new Set<string>()
  for (const item of pool) {
    if (picked.length >= pairCount) break
    const key = item.left.toLocaleLowerCase('es')
    if (usedLeft.has(key) && kind === 'pronoun-verb') continue
    usedLeft.add(key)
    picked.push(item)
  }
  if (picked.length < 3) {
    for (const item of pool) {
      if (picked.length >= pairCount) break
      if (picked.some((p) => p.id === item.id)) continue
      picked.push(item)
    }
  }
  if (picked.length < 3) {
    throw new Error(`[varios] Pocas parejas kind=${kind}`)
  }

  const pairs = shuffle(
    picked.map((i) => ({ id: i.id, left: i.left, right: i.right })),
    random,
  )
  const rightOrder = shuffle(
    pairs.map((p) => p.id),
    mulberry32(seed + 17),
  )

  const isPv = productId === 'quien-hace-que'
  return {
    id: `varios-${productId}-${seed}`,
    productId,
    prompt: isPv ? '¿Quién hace qué?' : '¿Nombre común o propio?',
    help: isPv
      ? 'Une el pronombre con el verbo que le corresponde (yo → escribo).'
      : 'Une el nombre común (ciudad, río…) con un nombre propio (París, Ebro…).',
    pairs,
    rightOrder,
  }
}

export function buildVariosSession(
  productId: VariosProductId,
  count = VARIOS_ROUNDS,
  seed = Date.now(),
): VariosBoard[] {
  return Array.from({ length: count }, (_, i) =>
    buildVariosBoard(productId, seed + i * 7919),
  )
}

export function isVariosProductId(v: string): v is VariosProductId {
  return v === 'quien-hace-que' || v === 'comun-propio'
}

export const VARIOS_LABELS: Record<VariosProductId, string> = {
  'quien-hace-que': 'Quién hace qué',
  'comun-propio': 'Común o propio',
}
