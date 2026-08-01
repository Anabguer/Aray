import type { FormarPalabrasRoundItem } from '@/feinetas'
import type { FormarPalabrasFeineta } from '@/feinetas/types'
import type { SpellPlayMode, SpellQuestion } from '@/spelling/types'
import { getMinigame } from '@/minigames/catalog'
import {
  buildFormarPalabrasRoundForMinigame,
  type FormarPalabrasRoundOptions,
} from '@/minigames/adapters/formarPalabras'
import {
  buildLegacySpellRoundForMinigame,
  type LegacySpellRoundOptions,
} from '@/minigames/adapters/legacySpell'
import { buildOrtografiaCorrectRound } from '@/minigames/adapters/ortografiaCorrect'

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

function buildOrtografiaLemmaRound(
  mode: SpellPlayMode,
  opts: LegacySpellRoundOptions,
): SpellQuestion[] {
  const count = opts.count
  const seed = opts.seed ?? Date.now()
  switch (mode) {
    case 'correct':
      return buildOrtografiaCorrectRound(count, seed, 'correct')
    default:
      throw new Error(`[minigames] Modo ortografía JSON aún no cableado: ${mode}`)
  }
}

/**
 * Punto único: buildRound(minigameId).
 * Fase 3 — Ortografía JSON + complete legacy + Formar palabras.
 */
export function buildRound(minigameId: string, opts: BuildRoundOptions = {}): RoundResult {
  const game = getMinigame(minigameId)

  if (game.mechanicId === 'ortografia-lemma-mcq') {
    const mode = (game.legacySpellMode ?? 'correct') as SpellPlayMode
    return {
      kind: 'spell-mcq',
      minigameId,
      questions: buildOrtografiaLemmaRound(mode, opts),
    }
  }

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
