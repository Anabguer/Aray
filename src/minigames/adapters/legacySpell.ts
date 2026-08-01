import { buildSpellRound, type BuildSpellRoundOptions } from '@/spelling/generator'
import { SPELL_ROUND_SIZE, type SpellPlayMode, type SpellQuestion } from '@/spelling/types'
import { getMinigame } from '@/minigames/catalog'

export type LegacySpellRoundOptions = {
  count?: number
  seed?: number
  preferMisses?: BuildSpellRoundOptions['preferMisses']
}

/** Adaptador temporal: delega 1:1 en el generator legacy. */
export function buildLegacySpellRound(
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

export function buildLegacySpellRoundForMinigame(
  minigameId: string,
  opts: LegacySpellRoundOptions = {},
): SpellQuestion[] {
  const game = getMinigame(minigameId)
  if (game.mechanicId !== 'legacy-spell' || game.source !== 'legacy') {
    throw new Error(`[minigames] ${minigameId} no es un adaptador legacy-spell`)
  }
  const mode = game.legacySpellMode as SpellPlayMode
  return buildLegacySpellRound(mode, opts)
}
