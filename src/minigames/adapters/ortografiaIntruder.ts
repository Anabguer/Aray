/**
 * Adaptador JSON → «La intrusa» (forma mal escrita entre correctas).
 * La intrusa sale solo de errors[] del ítem y no puede ser otra palabra válida ambigua.
 */
import { getOrtographyCorpus, ortographyMissKey } from '@/feinetas/ortographyCorpus'
import type { OrtographyCorpusEntry } from '@/feinetas/ortographyCorpus'
import {
  baseMcqFields,
  canBuildIntruderQuestion,
  itemSafeMisspellingsForBareMcq,
  mulberry32,
  pickEligibleCorpusEntry,
  shuffle,
} from '@/minigames/adapters/ortografiaShared'
import { SPELL_ROUND_SIZE, type SpellMcqQuestion, type SpellPlayMode } from '@/spelling/types'

function intruderPool(): OrtographyCorpusEntry[] {
  return getOrtographyCorpus().entries.filter(canBuildIntruderQuestion)
}

export function buildOrtografiaIntruderQuestion(
  seed: number,
  usedRefs: Set<string>,
  mode: SpellPlayMode = 'intruder',
  forced?: OrtographyCorpusEntry,
): SpellMcqQuestion {
  const random = mulberry32(seed)
  const entry = forced ?? pickEligibleCorpusEntry(random, usedRefs, intruderPool())
  if (!canBuildIntruderQuestion(entry)) {
    throw new Error(`[ortografia-intruder] Lema excluido: ${entry.lemma.id}`)
  }
  usedRefs.add(ortographyMissKey(entry.packId, entry.lemma.id))

  const errs = itemSafeMisspellingsForBareMcq(entry)
  if (errs.length === 0) {
    throw new Error(`[ortografia-intruder] Sin errores para ${entry.lemma.id}`)
  }
  const intruder = errs[Math.floor(random() * errs.length)]!

  const goods = new Set<string>([entry.lemma.lemma])
  const pool = getOrtographyCorpus().entries.filter(
    (e) => !(e.packId === entry.packId && e.lemma.id === entry.lemma.id),
  )
  let guard = 0
  while (goods.size < 3 && guard < 120 && pool.length > 0) {
    guard += 1
    const alt = pool[Math.floor(random() * pool.length)]!
    const w = alt.lemma.lemma
    if (w.toLocaleLowerCase('es') !== intruder.toLocaleLowerCase('es')) goods.add(w)
  }

  if (goods.size < 1) {
    throw new Error(`[ortografia-intruder] Sin rivales correctas para ${entry.lemma.id}`)
  }

  const options = shuffle([...goods, intruder], random)
  const unique = [...new Set(options.map((o) => o.toLocaleLowerCase('es')))]
  if (unique.length !== options.length) {
    throw new Error(`[ortografia-intruder] Opciones duplicadas en ${entry.lemma.id}`)
  }

  return {
    ...baseMcqFields(entry, mode, seed, 'in'),
    prompt: '¿Cuál está mal escrita?',
    tip: entry.lemma.tip ?? entry.lemma.ruleText,
    options,
    correctIndex: options.findIndex(
      (o) => o.toLocaleLowerCase('es') === intruder.toLocaleLowerCase('es'),
    ),
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
