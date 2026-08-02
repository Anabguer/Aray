/**
 * Adaptador JSON → «La intrusa» (forma mal escrita entre correctas).
 * Monorregla: correctas solo del mismo pack / ruleId que el ancla.
 * La intrusa sale solo de errors[] del ítem (no ambiguos).
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

function sameRulePackPool(entry: OrtographyCorpusEntry): OrtographyCorpusEntry[] {
  const rule = entry.lemma.ruleId
  const pack = entry.packId
  return getOrtographyCorpus().entries.filter(
    (e) =>
      e.packId === pack &&
      e.lemma.ruleId === rule &&
      !(e.packId === entry.packId && e.lemma.id === entry.lemma.id),
  )
}

function intruderPool(): OrtographyCorpusEntry[] {
  return getOrtographyCorpus().entries.filter(canBuildIntruderQuestion)
}

/**
 * Stats de packs: cuántos lemas ancla no llegan a 3 correctas del mismo pack
 * (además del ancla) para un set de 4 opciones.
 */
export function intruderPackSufficiency(): Array<{
  packId: string
  ruleId: string
  lemmaCount: number
  anchorsNeedingReducedOptions: number
}> {
  const byPack = new Map<string, OrtographyCorpusEntry[]>()
  for (const e of getOrtographyCorpus().entries) {
    const list = byPack.get(e.packId) ?? []
    list.push(e)
    byPack.set(e.packId, list)
  }
  const out: Array<{
    packId: string
    ruleId: string
    lemmaCount: number
    anchorsNeedingReducedOptions: number
  }> = []
  for (const [packId, list] of byPack) {
    const ruleId = list[0]?.lemma.ruleId ?? ''
    let reduced = 0
    for (const e of list) {
      if (!canBuildIntruderQuestion(e)) continue
      // Necesitamos ancla + 2 rivales = 3 correctas para 4 opciones
      if (list.length < 3) reduced += 1
    }
    out.push({ packId, ruleId, lemmaCount: list.length, anchorsNeedingReducedOptions: reduced })
  }
  return out
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
  const samePack = shuffle(sameRulePackPool(entry), random)
  for (const alt of samePack) {
    if (goods.size >= 3) break
    const w = alt.lemma.lemma
    if (w.toLocaleLowerCase('es') === intruder.toLocaleLowerCase('es')) continue
    goods.add(w)
  }

  // 2–4 opciones: al menos ancla + intrusa. Sin relleno global.
  const options = shuffle([...goods, intruder], random)
  if (options.length < 2) {
    throw new Error(`[ortografia-intruder] Pool insuficiente para ${entry.lemma.id}`)
  }
  const unique = [...new Set(options.map((o) => o.toLocaleLowerCase('es')))]
  if (unique.length !== options.length) {
    throw new Error(`[ortografia-intruder] Opciones duplicadas en ${entry.lemma.id}`)
  }

  const correctIndex = options.findIndex(
    (o) => o.toLocaleLowerCase('es') === intruder.toLocaleLowerCase('es'),
  )
  if (correctIndex < 0) {
    throw new Error(`[ortografia-intruder] Intrusa ausente en ${entry.lemma.id}`)
  }

  // Todas las no-intrusa deben compartir ruleId/pack del ancla
  for (let i = 0; i < options.length; i += 1) {
    if (i === correctIndex) continue
    const opt = options[i]!.toLocaleLowerCase('es')
    const match = getOrtographyCorpus().entries.find(
      (e) =>
        e.packId === entry.packId &&
        e.lemma.ruleId === entry.lemma.ruleId &&
        e.lemma.lemma.toLocaleLowerCase('es') === opt,
    )
    if (!match) {
      throw new Error(
        `[ortografia-intruder] Correcta fuera de pack (${entry.packId}): ${options[i]}`,
      )
    }
  }

  return {
    ...baseMcqFields(entry, mode, seed, 'in'),
    prompt: '¿Cuál está mal escrita?',
    tip: entry.lemma.tip ?? entry.lemma.ruleText,
    options,
    correctIndex,
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
