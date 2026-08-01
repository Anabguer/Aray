/**
 * Utilidades compartidas de adaptadores ortografía JSON → SpellMcqQuestion.
 * Distractores: solo `item.errors[]` del lema (sin heurísticas ni relleno).
 */
import type { OrtographyCorpusEntry } from '@/feinetas/ortographyCorpus'
import { getOrtographyCorpus, ortographyMissKey } from '@/feinetas/ortographyCorpus'
import type { SpellMcqQuestion, SpellPlayMode, SpellRuleId } from '@/spelling/types'

const KNOWN_RULES = new Set<SpellRuleId>([
  'r-rr',
  'hie-hue',
  'h',
  'hay-ahi-ay',
  'hacer-echar',
  'aba',
  'll-illa',
  'll-y',
  'haber-hablar',
  'b-v',
  'd-z',
  'c-z-qu',
  'mb-mp',
  'mb-mp-nv',
  'g-j',
  'bu-bur',
  'gu-gue',
  'tilde',
])

/** Superficies españolas frecuentes que no deben ser distractores ambiguos en MCQ sin contexto. */
const FREQUENT_ES_SURFACES = new Set(
  [
    'caso',
    'caco',
    'caza',
    'casa',
    'pero',
    'perro',
    'echo',
    'hecho',
    'echa',
    'hecha',
    'hola',
    'ola',
    'haya',
    'halla',
    'aya',
    'hay',
    'ahí',
    'ay',
    'vaca',
    'baca',
    'hierro',
    'yerro',
    'honda',
    'onda',
    'hojear',
    'ojear',
    'hasta',
    'asta',
    'haber',
    'a ver',
    'había',
    'avía',
    'tubo',
    'tuvo',
    'bien',
    'viento',
  ].map((s) => s.toLocaleLowerCase('es')),
)

export function mapPackRuleId(ruleId: string): SpellRuleId {
  if (KNOWN_RULES.has(ruleId as SpellRuleId)) return ruleId as SpellRuleId
  return 'tilde'
}

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

function norm(s: string): string {
  return s.toLocaleLowerCase('es')
}

/** Errores únicos del propio ítem (nunca de otros lemas, nunca inventados). */
export function itemApprovedErrors(entry: OrtographyCorpusEntry): string[] {
  const lemma = norm(entry.lemma.lemma)
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of entry.lemma.errors) {
    const key = norm(raw)
    if (!raw.trim() || key === lemma || seen.has(key)) continue
    seen.add(key)
    out.push(raw)
  }
  return out
}

function notesMarkIndependentWord(notes: string | undefined, err: string): boolean {
  if (!notes) return false
  if (!/hom[oó]fono|otra palabra|palabra distinta|hom[oó]nimo/i.test(notes)) return false
  return notes.toLocaleLowerCase('es').includes(norm(err))
}

/**
 * Forma que, sin imagen/frase, podría defenderse como respuesta «bien escrita».
 * No inventa; solo filtra distractores ambiguos del pool editorial.
 */
export function isAmbiguousRealWordDistractor(
  entry: OrtographyCorpusEntry,
  err: string,
): boolean {
  const key = norm(err)
  if (FREQUENT_ES_SURFACES.has(key)) return true
  if (notesMarkIndependentWord(entry.lemma.notes, err)) return true
  const corpus = getOrtographyCorpus()
  for (const e of corpus.entries) {
    if (norm(e.lemma.lemma) === key) return true
  }
  return false
}

/** Errores del ítem aptos para «¿Cuál está bien escrita?» sin contexto visual/frase. */
export function itemSafeMisspellingsForBareMcq(entry: OrtographyCorpusEntry): string[] {
  return itemApprovedErrors(entry).filter((e) => !isAmbiguousRealWordDistractor(entry, e))
}

export function canBuildBareCorrectQuestion(entry: OrtographyCorpusEntry): boolean {
  return itemSafeMisspellingsForBareMcq(entry).length >= 1
}

export function canBuildIntruderQuestion(entry: OrtographyCorpusEntry): boolean {
  // La intrusa debe ser claramente una forma mal escrita, no otra palabra válida.
  return itemSafeMisspellingsForBareMcq(entry).length >= 1
}

export function canBuildMissingQuestion(entry: OrtographyCorpusEntry): boolean {
  return itemApprovedErrors(entry).length >= 1
}

/** Imagen solo con ref real (no emoji de categoría). */
export function canBuildPictureQuestion(entry: OrtographyCorpusEntry): boolean {
  const ref = entry.lemma.image?.ref
  return typeof ref === 'string' && ref.trim().length > 0
}

export const PICTURE_MODE_ENABLED = false

/**
 * @deprecated No usar: pedía errores de otros lemas. Mantener nombre solo si tests antiguos.
 * Preferir `itemApprovedErrors` / `itemSafeMisspellingsForBareMcq`.
 */
export function collectCorpusDistractors(
  entry: OrtographyCorpusEntry,
  max = 3,
  _preferSameRule = true,
): string[] {
  return itemApprovedErrors(entry).slice(0, max)
}

export function pickCorpusEntry(
  random: () => number,
  usedRefs: Set<string>,
  pool?: OrtographyCorpusEntry[],
): OrtographyCorpusEntry {
  const source = pool ?? getOrtographyCorpus().entries
  const unused = source.filter((e) => !usedRefs.has(ortographyMissKey(e.packId, e.lemma.id)))
  const list = unused.length > 0 ? unused : source
  if (list.length === 0) {
    throw new Error('[ortografia] Pool vacío: ningún lema elegible para la mecánica')
  }
  return list[Math.floor(random() * list.length)]!
}

export function pickEligibleCorpusEntry(
  random: () => number,
  usedRefs: Set<string>,
  eligible: OrtographyCorpusEntry[],
): OrtographyCorpusEntry {
  return pickCorpusEntry(random, usedRefs, eligible)
}

export function baseMcqFields(
  entry: OrtographyCorpusEntry,
  mode: SpellPlayMode,
  seed: number,
  prefix: string,
): Pick<SpellMcqQuestion, 'kind' | 'id' | 'mode' | 'tip' | 'rule' | 'targetKey'> {
  return {
    kind: 'mcq',
    id: `${prefix}-${entry.lemma.id}-${seed}`,
    mode,
    tip: entry.lemma.tip ?? entry.lemma.ruleText,
    rule: mapPackRuleId(entry.lemma.ruleId),
    targetKey: ortographyMissKey(entry.packId, entry.lemma.id),
  }
}

/** 1 correcta + N distractores editoriales (2–4 opciones). Sin relleno. */
export function buildEditorialOptions(
  correct: string,
  distractors: string[],
  random: () => number,
): { options: string[]; correctIndex: number } {
  const uniqueWrong = distractors.slice(0, 3)
  if (uniqueWrong.length < 1) {
    throw new Error('[ortografia] Sin distractores editoriales suficientes')
  }
  const options = shuffle([correct, ...uniqueWrong], random)
  const correctIndex = options.findIndex((o) => norm(o) === norm(correct))
  if (correctIndex < 0) {
    throw new Error('[ortografia] La forma correcta no está en las opciones')
  }
  const lower = options.map(norm)
  if (new Set(lower).size !== options.length) {
    throw new Error('[ortografia] Opciones duplicadas')
  }
  return { options, correctIndex }
}

export function listExcludedForBareCorrect(): {
  excluded: OrtographyCorpusEntry[]
  eligible: OrtographyCorpusEntry[]
} {
  const excluded: OrtographyCorpusEntry[] = []
  const eligible: OrtographyCorpusEntry[] = []
  for (const e of getOrtographyCorpus().entries) {
    if (canBuildBareCorrectQuestion(e)) eligible.push(e)
    else excluded.push(e)
  }
  return { excluded, eligible }
}
