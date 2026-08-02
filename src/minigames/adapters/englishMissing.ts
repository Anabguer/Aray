/**
 * Letra que falta sobre lemma EN.
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
  buildOptions,
  mulberry32,
  packPool,
  pickCorpusEntry,
  shuffle,
} from '@/minigames/adapters/englishShared'

function graphemes(s: string): string[] {
  return [...s]
}

function blankDisplay(chars: string[], index: number): string {
  return chars.map((c, i) => (i === index ? '_' : c)).join('')
}

function letterDistractors(
  correct: string,
  packId: string,
  random: () => number,
  n = 3,
): string[] {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'
  const fromPack = new Set<string>()
  for (const e of packPool(packId)) {
    for (const ch of graphemes(e.lemma.lemma.toLowerCase())) {
      if (/[a-z]/.test(ch)) fromPack.add(ch)
    }
  }
  const pool = shuffle(
    [...fromPack, ...alphabet].filter(
      (c) => c.toLowerCase() !== correct.toLowerCase(),
    ),
    random,
  )
  const out: string[] = []
  const seen = new Set<string>()
  for (const c of pool) {
    const k = c.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(c.length === 1 ? c.toUpperCase() : c)
    if (out.length >= n) break
  }
  return out
}

export function buildEnglishMissingQuestion(
  packId: string,
  seed: number,
  usedRefs: Set<string>,
  mode: EnglishPlayMode = 'missing',
  forced?: EnglishCorpusEntry,
): EnglishMcqQuestion {
  const random = mulberry32(seed)
  const pool = packPool(packId).filter((e) => graphemes(e.lemma.lemma).length >= 3)
  const entry =
    forced && graphemes(forced.lemma.lemma).length >= 3
      ? forced
      : pickCorpusEntry(random, usedRefs, pool.length ? pool : packPool(packId))
  usedRefs.add(englishMissKey(entry.packId, entry.lemma.id))

  const chars = graphemes(entry.lemma.lemma)
  // Preferir índice interior
  let index = 1 + Math.floor(random() * Math.max(1, chars.length - 2))
  if (chars.length < 3) index = Math.floor(random() * chars.length)
  const correctUnit = chars[index]!
  const display = blankDisplay(chars, index)
  const presentCorrect =
    correctUnit.length === 1 ? correctUnit.toUpperCase() : correctUnit
  const { options, correctIndex } = buildOptions(
    presentCorrect,
    letterDistractors(correctUnit, packId, random),
    random,
  )

  return {
    ...baseEnglishMcq(entry, mode, seed, 'missing'),
    prompt: '¿Qué letra falta?',
    display,
    tip: entry.lemma.glossEs,
    options,
    correctIndex,
  }
}

export function buildEnglishMissingRound(
  packId: string,
  count = ENGLISH_ROUND_SIZE,
  seed = Date.now(),
  mode: EnglishPlayMode = 'missing',
): EnglishMcqQuestion[] {
  const used = new Set<string>()
  const out: EnglishMcqQuestion[] = []
  for (let i = 0; i < count; i += 1) {
    out.push(
      buildEnglishMissingQuestion(packId, seed + i * 6553, used, mode),
    )
  }
  return out
}
