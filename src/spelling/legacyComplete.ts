/**
 * Única puerta legacy de Ortografía: modo «Completa la frase».
 *
 * FLAG: SPELL_COMPLETE_USES_LEGACY = true hasta banco editorial de frases
 * aprobado + pack JSON + adaptador. Entonces retirar SPELL_CONTEXTS y este módulo.
 *
 * Prohibido: usar el banco legacy de lemas o distractores heurísticos aquí
 * (solo SPELL_CONTEXTS).
 */
import {
  SPELL_CONTEXTS,
  SPELL_ROUND_SIZE,
  type SpellContext,
  type SpellMcqQuestion,
  type SpellPlayMode,
  type SpellQuestion,
} from '@/spelling/types'

/** true hasta banco editorial de frases aprobado + pack + adaptador. */
export const SPELL_COMPLETE_USES_LEGACY = true as const

function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

function contextByKey(key: string): SpellContext | undefined {
  const id = key.startsWith('ctx:') ? key.slice(4) : key
  return SPELL_CONTEXTS.find((c) => c.id === id)
}

export function isLegacyCompleteMissKey(key: string): boolean {
  return key.startsWith('ctx:')
}

export function buildLegacyCompleteQuestion(
  seed: number,
  used: Set<string>,
  mode: SpellPlayMode = 'complete',
  preferKeys?: string[],
): SpellMcqQuestion {
  if (!SPELL_COMPLETE_USES_LEGACY) {
    throw new Error('[legacyComplete] Flag desactivado: migrar a pack de frases')
  }
  const rand = mulberry32(seed)
  const prefer =
    preferKeys
      ?.map((k) => contextByKey(k))
      .filter((c): c is SpellContext => c != null)
      .filter((c) => !used.has(c.id)) ?? []
  let ctx: SpellContext
  if (prefer.length > 0) {
    ctx = prefer[Math.floor(rand() * prefer.length)]!
  } else {
    const unused = SPELL_CONTEXTS.filter((c) => !used.has(c.id))
    const pool = unused.length > 0 ? unused : SPELL_CONTEXTS
    ctx = pool[Math.floor(rand() * pool.length)]!
  }
  used.add(ctx.id)
  const options = shuffle([...ctx.options], rand)
  const correct = ctx.options[ctx.correctIndex]!
  return {
    kind: 'mcq',
    id: `ctx-${ctx.id}-${seed}`,
    mode,
    prompt: 'Elige la forma que encaja en la frase',
    tip: ctx.tip,
    rule: ctx.rule,
    display: ctx.sentence,
    options,
    correctIndex: options.indexOf(correct),
    targetKey: `ctx:${ctx.id}`,
  }
}

export function buildLegacyCompleteRound(
  count = SPELL_ROUND_SIZE,
  seed = Date.now(),
  preferKeys?: string[],
): SpellQuestion[] {
  const used = new Set<string>()
  const out: SpellQuestion[] = []
  for (let i = 0; i < count; i += 1) {
    out.push(
      buildLegacyCompleteQuestion(
        seed + i * 9173,
        used,
        'complete',
        preferKeys,
      ),
    )
  }
  return out
}
