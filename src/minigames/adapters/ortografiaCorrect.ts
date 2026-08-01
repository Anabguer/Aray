/**
 * Adaptador JSON → SpellMcqQuestion (modo «forma correcta»).
 * Distractores solo desde errors[] del corpus. Sin SPELL_BANK.
 */
import { ortographyMissKey } from '@/feinetas/ortographyCorpus'
import type { OrtographyCorpusEntry } from '@/feinetas/ortographyCorpus'
import {
  baseMcqFields,
  collectCorpusDistractors,
  mulberry32,
  pickCorpusEntry,
  shuffle,
} from '@/minigames/adapters/ortografiaShared'
import { SPELL_ROUND_SIZE, type SpellMcqQuestion, type SpellPlayMode } from '@/spelling/types'

export function buildOrtografiaCorrectQuestion(
  seed: number,
  usedRefs: Set<string>,
  mode: SpellPlayMode = 'correct',
  forced?: OrtographyCorpusEntry,
): SpellMcqQuestion {
  const random = mulberry32(seed)
  const entry = forced ?? pickCorpusEntry(random, usedRefs)
  usedRefs.add(ortographyMissKey(entry.packId, entry.lemma.id))

  const distractors = collectCorpusDistractors(entry, 3)
  while (distractors.length < 3) {
    // Si el corpus no aporta 3 errores distintos, repetir el primero atestiguado (no inventar).
    distractors.push(distractors[0] ?? entry.lemma.errors[0]!)
  }
  const options = shuffle([entry.lemma.lemma, ...distractors.slice(0, 3)], random)
  const correctIndex = options.findIndex(
    (o) => o.toLocaleLowerCase('es') === entry.lemma.lemma.toLocaleLowerCase('es'),
  )
  if (correctIndex < 0) {
    throw new Error(`[ortografia-correct] Sin correcta para ${entry.lemma.id}`)
  }

  return {
    ...baseMcqFields(entry, mode, seed, 'ok'),
    prompt: '¿Cuál está bien escrita?',
    options,
    correctIndex,
  }
}

export function buildOrtografiaCorrectRound(
  count = SPELL_ROUND_SIZE,
  seed = Date.now(),
  mode: SpellPlayMode = 'correct',
): SpellMcqQuestion[] {
  const used = new Set<string>()
  const out: SpellMcqQuestion[] = []
  for (let i = 0; i < count; i += 1) {
    out.push(buildOrtografiaCorrectQuestion(seed + i * 9173, used, mode))
  }
  return out
}
