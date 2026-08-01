/**
 * Adaptador MCQ temporal para validar packs de lemas (JSON_SPEC).
 * No forma parte del spelling legacy ni del catálogo de minijuegos.
 */
import type { OrtographyLemma, OrtographyLemmaPack } from '@/feinetas/ortographyLemmaPack'

export type OrtographyMcqQuestion = {
  id: string
  lemmaId: string
  lemma: string
  prompt: string
  tip?: string
  ruleText: string
  options: string[]
  correctIndex: number
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

/** Distractores: errores del lema + errores de otros lemas del pack (sin inventar). */
export function collectDistractors(
  lemma: OrtographyLemma,
  pack: OrtographyLemmaPack,
  max = 3,
): string[] {
  const correct = lemma.lemma.toLocaleLowerCase('es')
  const seen = new Set<string>([correct])
  const out: string[] = []

  const push = (raw: string) => {
    const key = raw.toLocaleLowerCase('es')
    if (!raw.trim() || seen.has(key)) return
    seen.add(key)
    out.push(raw)
  }

  for (const err of lemma.errors) push(err)

  for (const other of pack.lemmas) {
    if (out.length >= max) break
    if (other.id === lemma.id) continue
    for (const err of other.errors) {
      if (out.length >= max) break
      push(err)
    }
  }

  return out.slice(0, max)
}

export function lemmaToCorrectMcq(
  lemma: OrtographyLemma,
  pack: OrtographyLemmaPack,
  random: () => number = Math.random,
): OrtographyMcqQuestion {
  const distractors = collectDistractors(lemma, pack, 3)
  const pool = shuffle([lemma.lemma, ...distractors], random)
  const correctIndex = pool.findIndex(
    (opt) => opt.toLocaleLowerCase('es') === lemma.lemma.toLocaleLowerCase('es'),
  )

  if (correctIndex < 0) {
    throw new Error(`[ortografia-mcq] No se encontró la correcta para ${lemma.id}`)
  }

  return {
    id: `mcq-${lemma.id}`,
    lemmaId: lemma.id,
    lemma: lemma.lemma,
    prompt: '¿Cuál está bien escrita?',
    tip: lemma.tip,
    ruleText: lemma.ruleText,
    options: pool,
    correctIndex,
  }
}

/** Ronda con todos los lemas del pack (piloto: 21). */
export function buildOrtographyPackRound(
  pack: OrtographyLemmaPack,
  seed = Date.now(),
): OrtographyMcqQuestion[] {
  const random = mulberry32(seed >>> 0)
  const order = shuffle(pack.lemmas, random)
  return order.map((lemma) => lemmaToCorrectMcq(lemma, pack, random))
}
