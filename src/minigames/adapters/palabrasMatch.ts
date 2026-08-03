/**
 * Empareja (match-pairs) para sinónimos / antónimos.
 * Tablero: tocar ancla → tocar pareja (una sola relación por tablero).
 */
import { listSemanticItems } from '@/feinetas/wordsBanks'
import type { WordsSemanticRelationKind } from '@/feinetas/wordsSemanticRelationPack'
import type { PalabrasMcqProductId } from '@/minigames/adapters/palabrasMcq'

export const PALABRAS_MATCH_PAIR_COUNT = 4

export type PalabrasMatchPair = {
  id: string
  left: string
  right: string
}

export type PalabrasMatchBoard = {
  format: 'match'
  id: string
  productId: PalabrasMcqProductId
  relation: WordsSemanticRelationKind
  prompt: string
  help: string
  left: PalabrasMatchPair[]
  rightOrder: string[] // pair ids shuffled
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

export function buildPalabrasMatchBoard(
  productId: PalabrasMcqProductId,
  seed: number,
  pairCount = PALABRAS_MATCH_PAIR_COUNT,
  usedIds?: Set<string>,
  relation: WordsSemanticRelationKind = 'synonym',
): PalabrasMatchBoard {
  const random = mulberry32(seed)
  const pool = shuffle(
    listSemanticItems(relation).filter((i) => !usedIds?.has(i.id)),
    random,
  )
  let pick = pool.slice(0, pairCount)
  if (pick.length < pairCount) {
    const extra = shuffle(listSemanticItems(relation), mulberry32(seed + 3)).filter(
      (i) => !pick.some((p) => p.id === i.id),
    )
    pick = [...pick, ...extra].slice(0, pairCount)
  }
  if (pick.length < 3) {
    throw new Error(`[palabras-match] Pocas parejas relation=${relation}`)
  }
  for (const p of pick) usedIds?.add(p.id)

  const left = shuffle(
    pick.map((item) => ({
      id: item.id,
      left: item.anchor,
      right: item.target,
    })),
    random,
  )
  const rightOrder = shuffle(
    left.map((p) => p.id),
    mulberry32(seed + 99),
  )

  const isSyn = relation === 'synonym'
  return {
    format: 'match',
    id: `match-${productId}-${relation}-${seed}`,
    productId,
    relation,
    prompt: isSyn ? 'Une los sinónimos' : 'Une los antónimos',
    help: isSyn
      ? 'Un sinónimo significa casi lo mismo. Toca una palabra y luego su pareja.'
      : 'Un antónimo significa lo contrario. Toca una palabra y luego su pareja.',
    left,
    rightOrder,
  }
}

export function rightLabelFor(
  board: PalabrasMatchBoard,
  pairId: string,
): string {
  return board.left.find((p) => p.id === pairId)?.right ?? ''
}
