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

/** Palabras con mayúscula que no son nombres propios en estas fichas. */
const NON_NAME_CAPS = new Set([
  'hoy',
  'esta',
  'el',
  'la',
  'los',
  'las',
  'un',
  'una',
  'después',
  'antes',
  'mientras',
])

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

function splitPunct(token: string): { bare: string; punct: string } {
  const m = token.match(/^(.*?)([.,;:!?¡¿]+)?$/u)
  return { bare: m?.[1] ?? token, punct: m?.[2] ?? '' }
}

function bareKey(token: string): string {
  return splitPunct(token).bare.toLocaleLowerCase('es')
}

function isProperNameToken(token: string): boolean {
  const { bare } = splitPunct(token)
  if (!bare) return false
  if (!/^\p{Lu}/u.test(bare)) return false
  return !NON_NAME_CAPS.has(bare.toLocaleLowerCase('es'))
}

/** Orden canónico de dos nombres; la puntuación del par queda en el segundo. */
function orderNamePair(a: string, b: string): [string, string] {
  const pa = splitPunct(a)
  const pb = splitPunct(b)
  const punct = pa.punct || pb.punct
  if (pa.bare.localeCompare(pb.bare, 'es') <= 0) {
    return [pa.bare, pb.bare + punct]
  }
  return [pb.bare, pa.bare + punct]
}

/**
 * Normaliza «Nombre y Nombre» y «a Nombre y a Nombre» para que el orden
 * de los dos nombres no importe al comparar.
 */
export function canonicalizeMontaTokens(tokens: string[]): string[] {
  const out = [...tokens]
  let i = 0
  while (i < out.length) {
    if (
      i + 4 < out.length &&
      bareKey(out[i]!) === 'a' &&
      isProperNameToken(out[i + 1]!) &&
      bareKey(out[i + 2]!) === 'y' &&
      bareKey(out[i + 3]!) === 'a' &&
      isProperNameToken(out[i + 4]!)
    ) {
      const [n1, n2] = orderNamePair(out[i + 1]!, out[i + 4]!)
      out[i + 1] = n1
      out[i + 4] = n2
      i += 5
      continue
    }
    if (
      i + 2 < out.length &&
      isProperNameToken(out[i]!) &&
      bareKey(out[i + 1]!) === 'y' &&
      isProperNameToken(out[i + 2]!)
    ) {
      const [n1, n2] = orderNamePair(out[i]!, out[i + 2]!)
      out[i] = n1
      out[i + 2] = n2
      i += 3
      continue
    }
    i += 1
  }
  return out
}

function hasCommutativeNames(tokens: string[]): boolean {
  for (let i = 0; i < tokens.length; i += 1) {
    if (
      i + 2 < tokens.length &&
      isProperNameToken(tokens[i]!) &&
      bareKey(tokens[i + 1]!) === 'y' &&
      isProperNameToken(tokens[i + 2]!)
    ) {
      return true
    }
    if (
      i + 4 < tokens.length &&
      bareKey(tokens[i]!) === 'a' &&
      isProperNameToken(tokens[i + 1]!) &&
      bareKey(tokens[i + 2]!) === 'y' &&
      bareKey(tokens[i + 3]!) === 'a' &&
      isProperNameToken(tokens[i + 4]!)
    ) {
      return true
    }
  }
  return false
}

function tipForTokens(tokens: string[], fallback: string | undefined): string {
  const base = fallback ?? 'Toca las palabras en orden. Empieza con mayúscula.'
  if (!hasCommutativeNames(tokens)) return base
  return `${base} Si hay dos nombres con «y», puedes ponerlos en cualquier orden.`
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
      tip: tipForTokens(item.tokens, item.tip),
    }
  })
}

export function isOrderCorrect(picked: string[], expected: string[]): boolean {
  if (picked.length !== expected.length) return false
  if (picked.every((t, i) => t === expected[i])) return true
  const a = canonicalizeMontaTokens(picked)
  const b = canonicalizeMontaTokens(expected)
  return a.every((t, i) => t === b[i])
}
