/**
 * Adaptador JSON → «Imagen y palabra».
 * Desactivado hasta que existan image.ref reales por lema (sin emoji genérico).
 */
import { getOrtographyCorpus, ortographyMissKey } from '@/feinetas/ortographyCorpus'
import type { OrtographyCorpusEntry } from '@/feinetas/ortographyCorpus'
import {
  baseMcqFields,
  buildEditorialOptions,
  canBuildPictureQuestion,
  itemSafeMisspellingsForBareMcq,
  mulberry32,
  PICTURE_MODE_ENABLED,
  pickCorpusEntry,
} from '@/minigames/adapters/ortografiaShared'
import { SPELL_ROUND_SIZE, type SpellMcqQuestion, type SpellPlayMode } from '@/spelling/types'

export { PICTURE_MODE_ENABLED }

export function listPictureReadyEntries(): OrtographyCorpusEntry[] {
  return getOrtographyCorpus().entries.filter(canBuildPictureQuestion)
}

export function buildOrtografiaPictureQuestion(
  seed: number,
  usedRefs: Set<string>,
  mode: SpellPlayMode = 'picture',
  forced?: OrtographyCorpusEntry,
): SpellMcqQuestion {
  if (!PICTURE_MODE_ENABLED) {
    throw new Error(
      '[ortografia-picture] Modo Imagen desactivado hasta disponer de image.ref reales',
    )
  }
  const random = mulberry32(seed)
  const pool = listPictureReadyEntries()
  const entry = forced ?? pickCorpusEntry(random, usedRefs, pool)
  if (!canBuildPictureQuestion(entry)) {
    throw new Error(`[ortografia-picture] Sin image.ref real: ${entry.lemma.id}`)
  }
  const distractors = itemSafeMisspellingsForBareMcq(entry)
  if (distractors.length < 1) {
    throw new Error(`[ortografia-picture] Sin errores editoriales aptos: ${entry.lemma.id}`)
  }
  usedRefs.add(ortographyMissKey(entry.packId, entry.lemma.id))

  const { options, correctIndex } = buildEditorialOptions(
    entry.lemma.lemma,
    distractors,
    random,
  )

  return {
    ...baseMcqFields(entry, mode, seed, 'pic'),
    prompt: '¿Cómo se escribe?',
    /** Sin emoji genérico: la UI solo mostrará asset cuando haya image.ref. */
    options,
    correctIndex,
  }
}

export function buildOrtografiaPictureRound(
  count = SPELL_ROUND_SIZE,
  seed = Date.now(),
  mode: SpellPlayMode = 'picture',
): SpellMcqQuestion[] {
  if (!PICTURE_MODE_ENABLED) {
    throw new Error(
      '[ortografia-picture] Modo Imagen desactivado hasta disponer de image.ref reales',
    )
  }
  const used = new Set<string>()
  const out: SpellMcqQuestion[] = []
  for (let i = 0; i < count; i += 1) {
    out.push(buildOrtografiaPictureQuestion(seed + i * 9173, used, mode))
  }
  return out
}
