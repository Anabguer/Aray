/**
 * Intrusa: 3 lemas de una categoría + 1 de otra (mismo pack).
 */
import type { EnglishCorpusEntry } from '@/feinetas/englishCorpus'
import { englishMissKey } from '@/feinetas/englishCorpus'
import {
  ENGLISH_ROUND_SIZE,
  type EnglishMcqQuestion,
  type EnglishPlayMode,
} from '@/english/types'
import {
  baseEnglishMcq,
  categoriesWithMinCount,
  mulberry32,
  packPool,
  shuffle,
} from '@/minigames/adapters/englishShared'

export function canBuildEnglishIntruder(packId: string): boolean {
  const cats = categoriesWithMinCount(packId, 3)
  if (cats.length === 0) return false
  const all = packPool(packId)
  // Need at least one lemma outside a size-3+ category, OR two categories with 3+
  if (categoriesWithMinCount(packId, 3).length >= 2) return true
  const big = cats[0]!
  return all.some((e) => e.lemma.category !== big)
}

function buildIntruderSet(
  packId: string,
  random: () => number,
): { majority: EnglishCorpusEntry[]; intruder: EnglishCorpusEntry } {
  const pool = packPool(packId)
  const byCat = new Map<string, EnglishCorpusEntry[]>()
  for (const e of pool) {
    const list = byCat.get(e.lemma.category) ?? []
    list.push(e)
    byCat.set(e.lemma.category, list)
  }
  const bigCats = [...byCat.entries()].filter(([, list]) => list.length >= 3)
  if (bigCats.length === 0) {
    throw new Error(`[ingles-intruder] Pack sin categoría ≥3: ${packId}`)
  }

  let majorityCat: string
  let minorityCat: string
  if (bigCats.length >= 2) {
    const shuffled = shuffle(bigCats, random)
    majorityCat = shuffled[0]![0]
    minorityCat = shuffled[1]![0]
  } else {
    majorityCat = bigCats[0]![0]
    const others = [...byCat.entries()].filter(([c]) => c !== majorityCat)
    if (others.length === 0) {
      throw new Error(`[ingles-intruder] Sin segunda categoría: ${packId}`)
    }
    minorityCat = others[Math.floor(random() * others.length)]![0]
  }

  const majorityPool = shuffle(byCat.get(majorityCat)!, random)
  const minorityPool = shuffle(byCat.get(minorityCat)!, random)
  const majority = majorityPool.slice(0, 3)
  const intruder = minorityPool[0]!
  return { majority, intruder }
}

export function buildEnglishIntruderQuestion(
  packId: string,
  seed: number,
  usedRefs: Set<string>,
  mode: EnglishPlayMode = 'intruder',
): EnglishMcqQuestion {
  const random = mulberry32(seed)
  if (!canBuildEnglishIntruder(packId)) {
    throw new Error(`[ingles-intruder] Pack no apto: ${packId}`)
  }
  // Reintentar si el set choca con used (suave)
  let set = buildIntruderSet(packId, random)
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const key = englishMissKey(set.intruder.packId, set.intruder.lemma.id)
    if (!usedRefs.has(key)) break
    set = buildIntruderSet(packId, mulberry32(seed + attempt * 997))
  }
  usedRefs.add(englishMissKey(set.intruder.packId, set.intruder.lemma.id))

  const options = shuffle(
    [...set.majority.map((e) => e.lemma.lemma), set.intruder.lemma.lemma],
    random,
  )
  const correctIndex = options.findIndex(
    (o) =>
      o.toLocaleLowerCase('en') ===
      set.intruder.lemma.lemma.toLocaleLowerCase('en'),
  )

  return {
    ...baseEnglishMcq(set.intruder, mode, seed, 'intruder'),
    prompt: '¿Cuál no encaja?',
    tip: 'Tres son del mismo grupo; una no',
    options,
    correctIndex,
  }
}

export function buildEnglishIntruderRound(
  packId: string,
  count = ENGLISH_ROUND_SIZE,
  seed = Date.now(),
  mode: EnglishPlayMode = 'intruder',
): EnglishMcqQuestion[] {
  const used = new Set<string>()
  const out: EnglishMcqQuestion[] = []
  for (let i = 0; i < count; i += 1) {
    out.push(
      buildEnglishIntruderQuestion(packId, seed + i * 7741, used, mode),
    )
  }
  return out
}
