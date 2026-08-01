/**
 * Adaptador JSON → SpellMcqQuestion (Completa la frase).
 * Fuente: feinetas/ortografia/frases-completar.json. Sin legacy.
 */
import frasesJson from '@feinetas/ortografia/frases-completar.json'
import {
  assertValidOrtographyPhrasesPack,
  type OrtographyPhraseItem,
  type OrtographyPhrasesPack,
} from '@/feinetas/ortographyPhrasesPack'
import { mapPackRuleId, mulberry32, shuffle } from '@/minigames/adapters/ortografiaShared'
import { SPELL_ROUND_SIZE, type SpellMcqQuestion, type SpellPlayMode } from '@/spelling/types'

assertValidOrtographyPhrasesPack(frasesJson)
const PACK = frasesJson as OrtographyPhrasesPack

export const ORTOGRAPHY_FRASES_PACK_ID = PACK.pack.id

export function getOrtographyPhrasesPack(): OrtographyPhrasesPack {
  return PACK
}

export function listActivePhraseItems(): OrtographyPhraseItem[] {
  return PACK.items.filter((i) => i.status !== 'deprecated')
}

export function getPhraseById(id: string): OrtographyPhraseItem | undefined {
  return listActivePhraseItems().find((i) => i.id === id)
}

export function phraseMissKey(itemId: string): string {
  return `${ORTOGRAPHY_FRASES_PACK_ID}:${itemId}`
}

export function isOrtographyPhraseMissKey(key: string): boolean {
  return key.startsWith(`${ORTOGRAPHY_FRASES_PACK_ID}:`)
}

export function buildOrtografiaCompleteQuestion(
  seed: number,
  usedIds: Set<string>,
  mode: SpellPlayMode = 'complete',
  preferIds?: string[],
): SpellMcqQuestion {
  const random = mulberry32(seed)
  const all = listActivePhraseItems()
  const prefer = preferIds
    ?.map((id) => getPhraseById(id.startsWith('frase-') ? id : id.replace(/^.*:/, '')))
    .filter((i): i is OrtographyPhraseItem => i != null)
    .filter((i) => !usedIds.has(i.id))

  let item: OrtographyPhraseItem
  if (prefer && prefer.length > 0) {
    item = prefer[Math.floor(random() * prefer.length)]!
  } else {
    const unused = all.filter((i) => !usedIds.has(i.id))
    const pool = unused.length > 0 ? unused : all
    item = pool[Math.floor(random() * pool.length)]!
  }
  usedIds.add(item.id)

  const options = shuffle([...item.options], random)
  const correct = item.options[item.correctIndex]!
  const correctIndex = options.findIndex(
    (o) => o.toLocaleLowerCase('es') === correct.toLocaleLowerCase('es'),
  )
  if (correctIndex < 0) {
    throw new Error(`[ortografia-complete] Sin correcta para ${item.id}`)
  }

  return {
    kind: 'mcq',
    id: `frase-${item.id}-${seed}`,
    mode,
    prompt: 'Elige la forma que encaja en la frase',
    /** Solo se usa en explicación post-fallo (no tip previo en UI). */
    tip: item.explanation,
    rule: mapPackRuleId(item.ruleId),
    display: item.sentence,
    options,
    correctIndex,
    targetKey: phraseMissKey(item.id),
  }
}

export function buildOrtografiaCompleteRound(
  count = SPELL_ROUND_SIZE,
  seed = Date.now(),
  preferKeys?: string[],
): SpellMcqQuestion[] {
  const used = new Set<string>()
  const preferIds = preferKeys?.map((k) =>
    k.startsWith(`${ORTOGRAPHY_FRASES_PACK_ID}:`) ? k.slice(ORTOGRAPHY_FRASES_PACK_ID.length + 1) : k,
  )
  const out: SpellMcqQuestion[] = []
  for (let i = 0; i < count; i += 1) {
    out.push(
      buildOrtografiaCompleteQuestion(seed + i * 9173, used, 'complete', preferIds),
    )
  }
  return out
}

/** Explicación post-respuesta desde el pack (no tip previo). */
export function getPhraseExplanation(targetKey: string | undefined): string | undefined {
  if (!targetKey || !isOrtographyPhraseMissKey(targetKey)) return undefined
  const id = targetKey.slice(ORTOGRAPHY_FRASES_PACK_ID.length + 1)
  return getPhraseById(id)?.explanation
}
