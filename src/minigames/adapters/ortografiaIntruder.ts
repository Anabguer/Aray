/**
 * Adaptador JSON → «La intrusa» (forma mal escrita entre correctas).
 */
import { getOrtographyCorpus, ortographyMissKey } from '@/feinetas/ortographyCorpus'
import type { OrtographyCorpusEntry } from '@/feinetas/ortographyCorpus'
import {
  baseMcqFields,
  mulberry32,
  pickCorpusEntry,
  shuffle,
} from '@/minigames/adapters/ortografiaShared'
import { SPELL_ROUND_SIZE, type SpellMcqQuestion, type SpellPlayMode } from '@/spelling/types'

export function buildOrtografiaIntruderQuestion(
  seed: number,
  usedRefs: Set<string>,
  mode: SpellPlayMode = 'intruder',
  forced?: OrtographyCorpusEntry,
): SpellMcqQuestion {
  const random = mulberry32(seed)
  const entry = forced ?? pickCorpusEntry(random, usedRefs)
  usedRefs.add(ortographyMissKey(entry.packId, entry.lemma.id))

  const errs = entry.lemma.errors.filter(
    (e) => e.toLocaleLowerCase('es') !== entry.lemma.lemma.toLocaleLowerCase('es'),
  )
  if (errs.length === 0) {
    throw new Error(`[ortografia-intruder] Sin errores para ${entry.lemma.id}`)
  }
  const intruder = errs[Math.floor(random() * errs.length)]!

  const goods = new Set<string>([entry.lemma.lemma])
  const pool = getOrtographyCorpus().entries.filter(
    (e) => !(e.packId === entry.packId && e.lemma.id === entry.lemma.id),
  )
  let guard = 0
  while (goods.size < 3 && guard < 80 && pool.length > 0) {
    guard += 1
    const alt = pool[Math.floor(random() * pool.length)]!
    const w = alt.lemma.lemma
    if (w.toLocaleLowerCase('es') !== intruder.toLocaleLowerCase('es')) goods.add(w)
  }

  const options = shuffle([...goods, intruder].slice(0, 4), random)
  if (!options.includes(intruder)) options[0] = intruder
  while (options.length < 4) {
    options.push(entry.lemma.lemma)
  }

  return {
    ...baseMcqFields(entry, mode, seed, 'in'),
    prompt: '¿Cuál está mal escrita?',
    tip: entry.lemma.tip ?? entry.lemma.ruleText,
    options: options.slice(0, 4),
    correctIndex: options.indexOf(intruder),
  }
}

export function buildOrtografiaIntruderRound(
  count = SPELL_ROUND_SIZE,
  seed = Date.now(),
  mode: SpellPlayMode = 'intruder',
): SpellMcqQuestion[] {
  const used = new Set<string>()
  const out: SpellMcqQuestion[] = []
  for (let i = 0; i < count; i += 1) {
    out.push(buildOrtografiaIntruderQuestion(seed + i * 9173, used, mode))
  }
  return out
}
