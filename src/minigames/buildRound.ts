import type { FormarPalabrasRoundItem } from '@/feinetas'
import type { FormarPalabrasFeineta } from '@/feinetas/types'
import type { SpellPlayMode, SpellQuestion } from '@/spelling/types'
import { getMinigame } from '@/minigames/catalog'
import {
  buildFormarPalabrasRoundForMinigame,
  type FormarPalabrasRoundOptions,
} from '@/minigames/adapters/formarPalabras'
import { buildOrtografiaCompleteRound } from '@/minigames/adapters/ortografiaComplete'
import { buildOrtografiaCorrectRound } from '@/minigames/adapters/ortografiaCorrect'
import { buildOrtografiaIntruderRound } from '@/minigames/adapters/ortografiaIntruder'
import { buildOrtografiaMissingRound } from '@/minigames/adapters/ortografiaMissing'
import { buildOrtografiaMixRound } from '@/minigames/adapters/ortografiaMix'
import { buildOrtografiaReviewRound } from '@/minigames/adapters/ortografiaReview'
import type { SpellMissEntry } from '@/spelling/missStore'

export type BuildRoundOptions = FormarPalabrasRoundOptions & {
  count?: number
  seed?: number
  preferMisses?: SpellMissEntry[]
}

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
  opts: BuildRoundOptions,
): SpellQuestion[] {
  const count = opts.count
  const seed = opts.seed ?? Date.now()
  switch (mode) {
    case 'correct':
      return buildOrtografiaCorrectRound(count, seed, 'correct')
    case 'intruder':
      return buildOrtografiaIntruderRound(count, seed, 'intruder')
    case 'missing':
      return buildOrtografiaMissingRound(count, seed, 'missing')
    case 'picture':
      throw new Error(
        '[minigames] Modo Imagen desactivado hasta disponer de image.ref reales por lema',
      )
    case 'complete': {
      const preferKeys = opts.preferMisses?.map((m) => m.key)
      return buildOrtografiaCompleteRound(count, seed, preferKeys)
    }
    case 'mix':
      return buildOrtografiaMixRound(count, seed)
    case 'review':
      return buildOrtografiaReviewRound(count, seed, opts.preferMisses ?? [])
    default:
      throw new Error(`[minigames] Modo ortografía desconocido: ${mode}`)
  }
}

/**
 * Punto único: buildRound(minigameId).
 * Fase 4 — Ortografía 100 % packs editoriales + Formar palabras.
 */
export function buildRound(minigameId: string, opts: BuildRoundOptions = {}): RoundResult {
  const game = getMinigame(minigameId)

  if (game.mechanicId === 'ortografia-lemma-mcq') {
    const mode = (game.spellPlayMode ?? 'correct') as SpellPlayMode
    return {
      kind: 'spell-mcq',
      minigameId,
      questions: buildOrtografiaLemmaRound(mode, opts),
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
