import type { FormarPalabrasRoundItem } from '@/feinetas'
import type { FormarPalabrasFeineta } from '@/feinetas/types'
import type { SpellQuestion } from '@/spelling/types'
import { getMinigame } from '@/minigames/catalog'
import {
  buildFormarPalabrasRoundForMinigame,
  type FormarPalabrasRoundOptions,
} from '@/minigames/adapters/formarPalabras'
import {
  buildLegacySpellRoundForMinigame,
  type LegacySpellRoundOptions,
} from '@/minigames/adapters/legacySpell'

export type BuildRoundOptions = LegacySpellRoundOptions & FormarPalabrasRoundOptions

export type SpellMcqRound = {
  kind: 'spell-mcq'
  minigameId: string
  questions: SpellQuestion[]
}

export type OrdenarLetrasRound = {
  kind: 'ordenar-letras'
  minigameId: string
  meta: FormarPalabrasFeineta
  items: FormarPalabrasRoundItem[]
}

export type RoundResult = SpellMcqRound | OrdenarLetrasRound

/**
 * Punto único: buildRound(minigameId).
 * Fase 0 — Ortografía legacy vía adaptador; Formar palabras vía pack existente.
 */
export function buildRound(minigameId: string, opts: BuildRoundOptions = {}): RoundResult {
  const game = getMinigame(minigameId)

  if (game.mechanicId === 'legacy-spell') {
    return {
      kind: 'spell-mcq',
      minigameId,
      questions: buildLegacySpellRoundForMinigame(minigameId, opts),
    }
  }

  if (game.id === 'formar-palabras' && game.mechanicId === 'ordenar-letras') {
    const round = buildFormarPalabrasRoundForMinigame(minigameId, opts)
    return {
      kind: 'ordenar-letras',
      minigameId,
      meta: round.meta,
      items: round.items,
    }
  }

  throw new Error(
    `[minigames] buildRound: sin adaptador para ${minigameId} (mecánica ${game.mechanicId})`,
  )
}
