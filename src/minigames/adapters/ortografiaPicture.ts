/**
 * Adaptador JSON → «Imagen y palabra».
 * Pool: image.recommended === true. Emoji por categoría (puente temporal JSON_SPEC).
 */
import { getOrtographyCorpus, ortographyMissKey } from '@/feinetas/ortographyCorpus'
import type { OrtographyCorpusEntry } from '@/feinetas/ortographyCorpus'
import type { OrtographyCategory } from '@/feinetas/ortographyLemmaPack'
import {
  baseMcqFields,
  collectCorpusDistractors,
  mulberry32,
  pickCorpusEntry,
  shuffle,
} from '@/minigames/adapters/ortografiaShared'
import { SPELL_ROUND_SIZE, type SpellMcqQuestion, type SpellPlayMode } from '@/spelling/types'

const CATEGORY_EMOJI: Record<OrtographyCategory, string> = {
  animales: '🐾',
  casa: '🏠',
  colegio: '📚',
  comida: '🍎',
  objetos: '📦',
  naturaleza: '🌿',
  acciones: '🏃',
  ciudad: '🏙️',
  cuerpo: '👤',
  otros: '🔤',
}

export function emojiForEntry(entry: OrtographyCorpusEntry): string {
  return CATEGORY_EMOJI[entry.lemma.category] ?? '🔤'
}

export function buildOrtografiaPictureQuestion(
  seed: number,
  usedRefs: Set<string>,
  mode: SpellPlayMode = 'picture',
  forced?: OrtographyCorpusEntry,
): SpellMcqQuestion {
  const random = mulberry32(seed)
  const pool = getOrtographyCorpus().pictureEntries
  const entry = forced ?? pickCorpusEntry(random, usedRefs, pool.length > 0 ? pool : undefined)
  usedRefs.add(ortographyMissKey(entry.packId, entry.lemma.id))

  const distractors = collectCorpusDistractors(entry, 3)
  while (distractors.length < 3) {
    distractors.push(distractors[0] ?? entry.lemma.errors[0]!)
  }
  const options = shuffle([entry.lemma.lemma, ...distractors.slice(0, 3)], random)
  const correctIndex = options.findIndex(
    (o) => o.toLocaleLowerCase('es') === entry.lemma.lemma.toLocaleLowerCase('es'),
  )

  return {
    ...baseMcqFields(entry, mode, seed, 'pic'),
    prompt: '¿Cómo se escribe?',
    emoji: emojiForEntry(entry),
    options,
    correctIndex,
  }
}

export function buildOrtografiaPictureRound(
  count = SPELL_ROUND_SIZE,
  seed = Date.now(),
  mode: SpellPlayMode = 'picture',
): SpellMcqQuestion[] {
  const used = new Set<string>()
  const out: SpellMcqQuestion[] = []
  for (let i = 0; i < count; i += 1) {
    out.push(buildOrtografiaPictureQuestion(seed + i * 9173, used, mode))
  }
  return out
}
