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

function glossDistractors(
  entry: EnglishCorpusEntry,
  packId: string,
  random: () => number,
  n = 3,
): string[] {
  const others = shuffle(
    packPool(packId).filter(
      (e) =>
        e.lemma.id !== entry.lemma.id &&
        e.lemma.glossEs.toLocaleLowerCase('es') !==
          entry.lemma.glossEs.toLocaleLowerCase('es'),
    ),
    random,
  )
  return others.slice(0, n).map((e) => e.lemma.glossEs)
}

export function buildEnglishMeaningQuestion(
  packId: string,
  seed: number,
  usedRefs: Set<string>,
  mode: EnglishPlayMode = 'meaning',
  forced?: EnglishCorpusEntry,
): EnglishMcqQuestion {
  const random = mulberry32(seed)
  const pool = packPool(packId)
  const entry = forced ?? pickCorpusEntry(random, usedRefs, pool)
  usedRefs.add(englishMissKey(entry.packId, entry.lemma.id))
  const { options, correctIndex } = buildOptions(
    entry.lemma.glossEs,
    glossDistractors(entry, packId, random),
    random,
  )
  const tipByPack: Record<string, string> = {
    'ingles-there-is':
      "There's = 1 · There are = 2+ · There aren't any · Yes/No, there are/aren't",
    'ingles-prepositions':
      'on = encima · in = dentro · under = debajo · next to = al lado',
    'ingles-numbers': 'Con guion: twenty-eight = 28',
  }
  return {
    ...baseEnglishMcq(entry, mode, seed, 'meaning'),
    prompt: '¿Qué significa?',
    display: entry.lemma.lemma,
    tip: tipByPack[packId] ?? 'Elige el significado en español',
    options,
    correctIndex,
  }
}

export function buildEnglishMeaningRound(
  packId: string,
  count = ENGLISH_ROUND_SIZE,
  seed = Date.now(),
  mode: EnglishPlayMode = 'meaning',
): EnglishMcqQuestion[] {
  const used = new Set<string>()
  const out: EnglishMcqQuestion[] = []
  for (let i = 0; i < count; i += 1) {
    out.push(
      buildEnglishMeaningQuestion(packId, seed + i * 9173, used, mode),
    )
  }
  return out
}
