import { buildSpellRound, type BuildSpellRoundOptions } from '@/spelling/generator'
import { buildLegacyCompleteRound } from '@/spelling/legacyComplete'
import { SPELL_ROUND_SIZE, type SpellPlayMode, type SpellQuestion } from '@/spelling/types'
import { getMinigame } from '@/minigames/catalog'

export type LegacySpellRoundOptions = {
  count?: number
  seed?: number
  preferMisses?: BuildSpellRoundOptions['preferMisses']
}

/**
 * Adaptador legacy temporal: SOLO modo `complete` (SPELL_CONTEXTS).
 * Otros modos deben usar ortografia-lemma-mcq.
 */
export function buildLegacySpellRound(
  mode: SpellPlayMode,
  opts: LegacySpellRoundOptions = {},
): SpellQuestion[] {
  if (mode !== 'complete') {
    throw new Error(
      `[legacy-spell] Solo «complete» permanece en legacy; recibido: ${mode}. Usar packs JSON.`,
    )
  }
  const preferKeys = opts.preferMisses?.map((m) => m.key)
  return buildLegacyCompleteRound(
    opts.count ?? SPELL_ROUND_SIZE,
    opts.seed ?? Date.now(),
    preferKeys,
  )
}

export function buildLegacySpellRoundForMinigame(
  minigameId: string,
  opts: LegacySpellRoundOptions = {},
): SpellQuestion[] {
  const game = getMinigame(minigameId)
  if (game.mechanicId !== 'legacy-spell' || game.source !== 'legacy') {
    throw new Error(`[minigames] ${minigameId} no es un adaptador legacy-spell`)
  }
  const mode = game.legacySpellMode as SpellPlayMode
  if (mode !== 'complete') {
    throw new Error(
      `[legacy-spell] ${minigameId} no debería ser legacy (solo spelling-complete)`,
    )
  }
  return buildLegacySpellRound(mode, opts)
}

/** @deprecated Solo para tests que aún comparan generator completo. */
export function buildLegacySpellRoundViaGenerator(
  mode: SpellPlayMode,
  opts: LegacySpellRoundOptions = {},
): SpellQuestion[] {
  return buildSpellRound(
    mode,
    opts.count ?? SPELL_ROUND_SIZE,
    opts.seed ?? Date.now(),
    opts.preferMisses ? { preferMisses: opts.preferMisses } : undefined,
  )
}
