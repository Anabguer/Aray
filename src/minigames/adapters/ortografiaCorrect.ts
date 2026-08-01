/**
 * Adaptador JSON → SpellMcqQuestion (modo «forma correcta»).
 * Distractores: solo errors[] del propio ítem, no ambiguos como palabra real.
 */
import { ortographyMissKey } from '@/feinetas/ortographyCorpus'
import type { OrtographyCorpusEntry } from '@/feinetas/ortographyCorpus'
import {
  baseMcqFields,
  buildEditorialOptions,
  canBuildBareCorrectQuestion,
  itemSafeMisspellingsForBareMcq,
  listExcludedForBareCorrect,
  mulberry32,
  pickEligibleCorpusEntry,
} from '@/minigames/adapters/ortografiaShared'
import { SPELL_ROUND_SIZE, type SpellMcqQuestion, type SpellPlayMode } from '@/spelling/types'

export function buildOrtografiaCorrectQuestion(
  seed: number,
  usedRefs: Set<string>,
  mode: SpellPlayMode = 'correct',
  forced?: OrtographyCorpusEntry,
): SpellMcqQuestion {
  const random = mulberry32(seed)
  const { eligible } = listExcludedForBareCorrect()
  const entry =
    forced ??
    pickEligibleCorpusEntry(random, usedRefs, eligible)
  if (!canBuildBareCorrectQuestion(entry)) {
    throw new Error(
      `[ortografia-correct] Lema excluido (sin errores editoriales no ambiguos): ${entry.lemma.id}`,
    )
  }
  usedRefs.add(ortographyMissKey(entry.packId, entry.lemma.id))

  const distractors = itemSafeMisspellingsForBareMcq(entry)
  const { options, correctIndex } = buildEditorialOptions(
    entry.lemma.lemma,
    distractors,
    random,
  )

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
