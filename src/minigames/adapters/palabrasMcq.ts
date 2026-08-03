/**
 * Adaptadores Palabras → MCQ + Empareja (relaciones semánticas).
 * Morph (singular/plural, género) pasó a Clasifica.
 */
import { listSemanticItems, getWordsSemanticPack } from '@/feinetas/wordsBanks'
import type { WordsSemanticRelationKind } from '@/feinetas/wordsSemanticRelationPack'
import {
  buildPalabrasMatchBoard,
  type PalabrasMatchBoard,
} from '@/minigames/adapters/palabrasMatch'

export const PALABRAS_MCQ_ROUND_SIZE = 8

export type PalabrasMcqProductId = 'sinonimos' | 'antonimos'

export type PalabrasMcqQuestion = {
  format: 'mcq'
  id: string
  productId: PalabrasMcqProductId
  prompt: string
  options: string[]
  correctIndex: number
  tip?: string
  itemKey: string
}

export type PalabrasRoundItem = PalabrasMcqQuestion | PalabrasMatchBoard

/** Texto para el niño al fallar (sinónimos / antónimos). */
export const SEMANTIC_MISS_TIP: Record<WordsSemanticRelationKind, string> = {
  synonym:
    'Un sinónimo es una palabra que significa casi lo mismo. Ejemplo: alegre ≈ contento.',
  antonym:
    'Un antónimo es una palabra que significa lo contrario. Ejemplo: alto ↔ bajo.',
}

/**
 * Notas de ficha/editorial no se muestran al niño.
 */
export function kidFacingTip(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined
  const t = raw.trim()
  if (
    /\bfitxa\b|\bficha\s*\d|\beje\b|\bsolucionari\b|\banaya\b|\bvicens\b|\bsavia\b|\bcap_\d|\bmulti-banco\b|\bcongelado\b|\bauditor[ií]a\b|\bparadigma\b|\bdrill\b|\bconectado\b|\bmantenido tras\b|\bcru[cz]e con\b/i.test(
      t,
    )
  ) {
    return undefined
  }
  return t
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

function norm(s: string): string {
  return s.toLocaleLowerCase('es')
}

function buildOptions(
  correct: string,
  wrongs: string[],
  random: () => number,
): { options: string[]; correctIndex: number } {
  const seen = new Set<string>([norm(correct)])
  const uniqueWrong: string[] = []
  for (const w of wrongs) {
    const key = norm(w)
    if (!w.trim() || seen.has(key)) continue
    seen.add(key)
    uniqueWrong.push(w)
    if (uniqueWrong.length >= 3) break
  }
  if (uniqueWrong.length < 1) {
    throw new Error('[palabras] Sin opciones incorrectas editoriales')
  }
  const options = shuffle([correct, ...uniqueWrong], random)
  const correctIndex = options.findIndex((o) => norm(o) === norm(correct))
  return { options, correctIndex }
}

function relationForProduct(
  productId: PalabrasMcqProductId,
): WordsSemanticRelationKind {
  return productId === 'sinonimos' ? 'synonym' : 'antonym'
}

export function buildPalabrasSemanticQuestion(
  productId: PalabrasMcqProductId,
  seed: number,
  usedIds: Set<string>,
): PalabrasMcqQuestion {
  const relation = relationForProduct(productId)
  const pack = getWordsSemanticPack()
  const pool = shuffle(
    listSemanticItems(relation).filter((i) => !usedIds.has(i.id)),
    mulberry32(seed),
  )
  const item =
    pool[0] ?? shuffle(listSemanticItems(relation), mulberry32(seed + 1))[0]
  if (!item) throw new Error(`[palabras] Sin ítems relation=${relation}`)
  usedIds.add(item.id)

  const rand = mulberry32(seed + 29)
  const prompt =
    relation === 'synonym'
      ? `¿Cuál es un sinónimo de «${item.anchor}»?`
      : `¿Cuál es un antónimo de «${item.anchor}»?`

  const { options, correctIndex } = buildOptions(
    item.target,
    item.distractors,
    rand,
  )

  return {
    format: 'mcq',
    id: `${productId}-${item.id}-${seed}`,
    productId,
    prompt,
    options,
    correctIndex,
    tip: SEMANTIC_MISS_TIP[relation],
    itemKey: `${pack.pack.id}:${item.id}`,
  }
}

/**
 * Ronda mixta: ~half MCQ, ~half Empareja (según semilla).
 * Empareja cuenta como 1 ítem de ronda (tablero completo).
 */
export function buildPalabrasMcqRound(
  productId: PalabrasMcqProductId,
  count = PALABRAS_MCQ_ROUND_SIZE,
  seed = Date.now(),
): PalabrasRoundItem[] {
  const used = new Set<string>()
  const out: PalabrasRoundItem[] = []
  const random = mulberry32(seed)
  for (let i = 0; i < count; i += 1) {
    const qSeed = seed + i * 7919
    // ~35% Empareja, resto MCQ
    const wantMatch = random() < 0.35
    if (wantMatch) {
      out.push(buildPalabrasMatchBoard(productId, qSeed, 4, used))
    } else {
      out.push(buildPalabrasSemanticQuestion(productId, qSeed, used))
    }
  }
  // Garantizar al menos 1 de cada si hay stock
  const hasMcq = out.some((q) => q.format === 'mcq')
  const hasMatch = out.some((q) => q.format === 'match')
  if (!hasMatch && out.length > 0) {
    out[out.length - 1] = buildPalabrasMatchBoard(
      productId,
      seed + 4242,
      4,
      used,
    )
  }
  if (!hasMcq && out.length > 1) {
    out[0] = buildPalabrasSemanticQuestion(productId, seed + 111, used)
  }
  return out
}

export function isPalabrasMcqProductId(v: string): v is PalabrasMcqProductId {
  return v === 'sinonimos' || v === 'antonimos'
}

export const PALABRAS_MCQ_LABELS: Record<PalabrasMcqProductId, string> = {
  sinonimos: 'Sinónimos',
  antonimos: 'Antónimos',
}
