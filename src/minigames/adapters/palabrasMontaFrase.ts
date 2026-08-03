/**
 * Monta la frase: ordenar tokens tocando.
 */
import { listMontaFraseItems } from '@/feinetas/wordsBanks'

export const MONTA_FRASE_ROUND_SIZE = 8

export type MontaFraseQuestion = {
  id: string
  tokens: string[]
  scrambled: string[]
  sentence: string
  tip: string
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

/** Baraja hasta que el orden no coincida con la solución (si hay ≥2 tokens). */
function scrambleTokens(tokens: string[], random: () => number): string[] {
  if (tokens.length < 2) return [...tokens]
  let out = shuffle(tokens, random)
  let guard = 0
  while (out.every((t, i) => t === tokens[i]) && guard < 12) {
    out = shuffle(tokens, random)
    guard += 1
  }
  return out
}

export function buildMontaFraseRound(
  count = MONTA_FRASE_ROUND_SIZE,
  seed = Date.now(),
): MontaFraseQuestion[] {
  const random = mulberry32(seed)
  const pool = shuffle(listMontaFraseItems(), random)
  const pick = pool.slice(0, Math.min(count, pool.length))
  if (pick.length < Math.min(count, 4)) {
    throw new Error('[monta-frase] Pocas frases en el banco')
  }
  return pick.map((item, i) => {
    const r = mulberry32(seed + (i + 1) * 1337)
    return {
      id: `${item.id}-${seed}-${i}`,
      tokens: item.tokens,
      scrambled: scrambleTokens(item.tokens, r),
      sentence: item.tokens.join(' '),
      tip: item.tip ?? 'Toca las palabras en orden. Empieza con mayúscula.',
    }
  })
}

export function isOrderCorrect(picked: string[], expected: string[]): boolean {
  if (picked.length !== expected.length) return false
  return picked.every((t, i) => t === expected[i])
}
