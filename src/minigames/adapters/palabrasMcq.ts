/**
 * Adaptadores Palabras → MCQ (morph + relaciones semánticas).
 * Solo datos editoriales; sin inventar distractores.
 */
import {
  listMorphItems,
  listSemanticItems,
  getWordsMorphPack,
  getWordsSemanticPack,
} from '@/feinetas/wordsBanks'
import type { WordsMorphAxis } from '@/feinetas/wordsMorphPairPack'
import type { WordsSemanticRelationKind } from '@/feinetas/wordsSemanticRelationPack'

export const PALABRAS_MCQ_ROUND_SIZE = 8

export type PalabrasMcqProductId =
  | 'singular-plural'
  | 'masculino-femenino'
  | 'sinonimos'
  | 'antonimos'

export type PalabrasMcqQuestion = {
  id: string
  productId: PalabrasMcqProductId
  prompt: string
  options: string[]
  correctIndex: number
  tip?: string
  itemKey: string
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

function axisForProduct(productId: PalabrasMcqProductId): WordsMorphAxis | null {
  if (productId === 'singular-plural') return 'number'
  if (productId === 'masculino-femenino') return 'gender'
  return null
}

function relationForProduct(
  productId: PalabrasMcqProductId,
): WordsSemanticRelationKind | null {
  if (productId === 'sinonimos') return 'synonym'
  if (productId === 'antonimos') return 'antonym'
  return null
}

export function buildPalabrasMorphQuestion(
  productId: 'singular-plural' | 'masculino-femenino',
  seed: number,
  usedIds: Set<string>,
): PalabrasMcqQuestion {
  const axis = axisForProduct(productId)!
  const pack = getWordsMorphPack()
  const pool = shuffle(
    listMorphItems(axis).filter((i) => !usedIds.has(i.id)),
    mulberry32(seed),
  )
  const item = pool[0] ?? shuffle(listMorphItems(axis), mulberry32(seed + 1))[0]
  if (!item) throw new Error(`[palabras] Sin ítems morph axis=${axis}`)
  usedIds.add(item.id)

  const rand = mulberry32(seed + 17)
  const askForB =
    item.promptSide === 'b'
      ? true
      : item.promptSide === 'a'
        ? false
        : rand() < 0.5
  const shown = askForB ? item.formA : item.formB
  const correct = askForB ? item.formB : item.formA

  const prompt =
    axis === 'number'
      ? askForB
        ? `¿Cuál es el plural de «${shown}»?`
        : `¿Cuál es el singular de «${shown}»?`
      : askForB
        ? `¿Cuál es el femenino de «${shown}»?`
        : `¿Cuál es el masculino de «${shown}»?`

  const editorialWrong = (item.distractors ?? []).filter(
    (d) => norm(d) !== norm(correct) && norm(d) !== norm(shown),
  )
  const wrongs = editorialWrong.length > 0 ? editorialWrong : [shown]
  const { options, correctIndex } = buildOptions(correct, wrongs, rand)

  return {
    id: `${productId}-${item.id}-${seed}`,
    productId,
    prompt,
    options,
    correctIndex,
    tip: item.notes ?? item.note,
    itemKey: `${pack.pack.id}:${item.id}`,
  }
}

export function buildPalabrasSemanticQuestion(
  productId: 'sinonimos' | 'antonimos',
  seed: number,
  usedIds: Set<string>,
): PalabrasMcqQuestion {
  const relation = relationForProduct(productId)!
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
    id: `${productId}-${item.id}-${seed}`,
    productId,
    prompt,
    options,
    correctIndex,
    tip: item.ruleText ?? item.notes,
    itemKey: `${pack.pack.id}:${item.id}`,
  }
}

export function buildPalabrasMcqRound(
  productId: PalabrasMcqProductId,
  count = PALABRAS_MCQ_ROUND_SIZE,
  seed = Date.now(),
): PalabrasMcqQuestion[] {
  const used = new Set<string>()
  const out: PalabrasMcqQuestion[] = []
  for (let i = 0; i < count; i += 1) {
    const qSeed = seed + i * 7919
    if (productId === 'singular-plural' || productId === 'masculino-femenino') {
      out.push(buildPalabrasMorphQuestion(productId, qSeed, used))
    } else {
      out.push(buildPalabrasSemanticQuestion(productId, qSeed, used))
    }
  }
  return out
}

export function isPalabrasMcqProductId(v: string): v is PalabrasMcqProductId {
  return (
    v === 'singular-plural' ||
    v === 'masculino-femenino' ||
    v === 'sinonimos' ||
    v === 'antonimos'
  )
}

export const PALABRAS_MCQ_LABELS: Record<PalabrasMcqProductId, string> = {
  'singular-plural': 'Singular / plural',
  'masculino-femenino': 'Masculino / femenino',
  sinonimos: 'Sinónimos',
  antonimos: 'Antónimos',
}
