import {
  buildFormarPalabrasRound,
  type FormarPalabrasRoundItem,
} from '@/feinetas'
import type { FormarPalabrasFeineta } from '@/feinetas/types'
import { getMinigame } from '@/minigames/catalog'

export type FormarPalabrasRoundOptions = {
  count?: number
  random?: () => number
}

export type FormarPalabrasRoundResult = {
  meta: FormarPalabrasFeineta
  items: FormarPalabrasRoundItem[]
}

/** Adaptador: reutiliza el builder existente (pack JSON intacto). */
export function buildFormarPalabrasRoundForMinigame(
  minigameId: string,
  opts: FormarPalabrasRoundOptions = {},
): FormarPalabrasRoundResult {
  const game = getMinigame(minigameId)
  if (game.id !== 'formar-palabras' || game.mechanicId !== 'ordenar-letras') {
    throw new Error(`[minigames] ${minigameId} no es formar-palabras`)
  }
  return buildFormarPalabrasRound(opts.count ?? 8, opts.random)
}
