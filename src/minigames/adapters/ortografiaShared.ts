/**
 * Utilidades compartidas de adaptadores ortografía JSON → SpellMcqQuestion.
 * No importa SPELL_BANK / makeDistractors / lemmas.generated.
 */
import type { OrtographyCorpusEntry } from '@/feinetas/ortographyCorpus'
import { getOrtographyCorpus, ortographyMissKey } from '@/feinetas/ortographyCorpus'
import type { OrtographyLemma } from '@/feinetas/ortographyLemmaPack'
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

/** Distractores solo desde errors[] del corpus (sin inventar). */
export function collectCorpusDistractors(
  entry: OrtographyCorpusEntry,
  max = 3,
  preferSameRule = true,
): string[] {
  const corpus = getOrtographyCorpus()
  const correct = entry.lemma.lemma.toLocaleLowerCase('es')
  const seen = new Set<string>([correct])
  const out: string[] = []

  const push = (raw: string) => {
    const key = raw.toLocaleLowerCase('es')
    if (!raw.trim() || seen.has(key)) return
    seen.add(key)
    out.push(raw)
  }

  for (const err of entry.lemma.errors) push(err)

  const others = preferSameRule
    ? [
        ...corpus.entries.filter(
          (e) => e.lemma.ruleId === entry.lemma.ruleId && e.lemma.id !== entry.lemma.id,
        ),
        ...corpus.entries.filter((e) => e.lemma.ruleId !== entry.lemma.ruleId),
      ]
    : corpus.entries

  for (const other of others) {
    if (out.length >= max) break
    if (other.lemma.id === entry.lemma.id && other.packId === entry.packId) continue
    for (const err of other.lemma.errors) {
      if (out.length >= max) break
      push(err)
    }
  }

  return out.slice(0, max)
}

export function pickCorpusEntry(
  random: () => number,
  usedRefs: Set<string>,
  pool?: OrtographyCorpusEntry[],
): OrtographyCorpusEntry {
  const source = pool ?? getOrtographyCorpus().entries
  const unused = source.filter((e) => !usedRefs.has(ortographyMissKey(e.packId, e.lemma.id)))
  const list = unused.length > 0 ? unused : source
  return list[Math.floor(random() * list.length)]!
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

export function lemmaErrorsAreAttested(lemma: OrtographyLemma, options: string[]): boolean {
  const allowed = new Set(
    [lemma.lemma, ...lemma.errors].map((s) => s.toLocaleLowerCase('es')),
  )
  // distractors may come from other lemmas' errors — caller checks separately
  return options.some((o) => o.toLocaleLowerCase('es') === lemma.lemma.toLocaleLowerCase('es'))
}
