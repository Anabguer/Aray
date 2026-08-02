/**
 * Utilidades compartidas de adaptadores de Inglés.
 */
import type { EnglishCorpusEntry } from '@/feinetas/englishCorpus'
import { englishMissKey, listEnglishCorpusForPack } from '@/feinetas/englishCorpus'
import type { EnglishMcqQuestion, EnglishPlayMode } from '@/english/types'

export function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

export function pickCorpusEntry(
  random: () => number,
  usedRefs: Set<string>,
  pool: EnglishCorpusEntry[],
): EnglishCorpusEntry {
  const free = pool.filter(
    (e) => !usedRefs.has(englishMissKey(e.packId, e.lemma.id)),
  )
  const source = free.length > 0 ? free : pool
  if (source.length === 0) {
    throw new Error('[ingles] Pool de lemas vacío')
  }
  // Preferir más frecuentes
  const weights = source.map((e) => {
    if (e.lemma.frequency === 'muy_frecuente') return 3
    if (e.lemma.frequency === 'frecuente') return 2
    return 1
  })
  const total = weights.reduce((a, b) => a + b, 0)
  let roll = random() * total
  for (let i = 0; i < source.length; i += 1) {
    roll -= weights[i]!
    if (roll <= 0) return source[i]!
  }
  return source[source.length - 1]!
}

export function packPool(packId: string): EnglishCorpusEntry[] {
  return listEnglishCorpusForPack(packId)
}

export function buildOptions(
  correct: string,
  distractors: string[],
  random: () => number,
  maxOptions = 4,
): { options: string[]; correctIndex: number } {
  const seen = new Set<string>()
  const uniq: string[] = []
  const push = (s: string) => {
    const k = s.toLocaleLowerCase('es')
    if (seen.has(k)) return
    seen.add(k)
    uniq.push(s)
  }
  push(correct)
  for (const d of distractors) push(d)
  const capped = uniq.slice(0, maxOptions)
  const options = shuffle(capped, random)
  return {
    options,
    correctIndex: options.findIndex(
      (o) => o.toLocaleLowerCase('es') === correct.toLocaleLowerCase('es'),
    ),
  }
}

export function baseEnglishMcq(
  entry: EnglishCorpusEntry,
  mode: EnglishPlayMode,
  seed: number,
  sourceMode: Exclude<EnglishPlayMode, 'mix' | 'review'>,
): Pick<
  EnglishMcqQuestion,
  'kind' | 'id' | 'mode' | 'targetKey' | 'sourceMode'
> {
  return {
    kind: 'mcq',
    id: `en-${sourceMode}-${entry.lemma.id}-${seed}`,
    mode,
    targetKey: englishMissKey(entry.packId, entry.lemma.id),
    sourceMode,
  }
}

/** Categorías con ≥3 lemas en el pack (para intrusa). */
export function categoriesWithMinCount(
  packId: string,
  min: number,
): string[] {
  const counts = new Map<string, number>()
  for (const e of packPool(packId)) {
    counts.set(e.lemma.category, (counts.get(e.lemma.category) ?? 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= min)
    .map(([c]) => c)
}
