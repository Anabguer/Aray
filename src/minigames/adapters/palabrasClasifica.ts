/**
 * Clasifica: rondas Singular/Plural · Masculino/Femenino · Artículos · género+número.
 * Tap palabra → tap bando (sin DnD library).
 */
import { listClasificaItems } from '@/feinetas/wordsBanks'
import type {
  WordsClasificaArticle,
  WordsClasificaItem,
} from '@/feinetas/wordsClasificaPack'

export const CLASIFICA_POOL_SIZE = 6
export const CLASIFICA_ROUNDS = 6

export type ClasificaKind = 'number' | 'gender' | 'article' | 'gender-number'

export type ClasificaBinId = string

export type ClasificaChip = {
  id: string
  word: string
  binId: ClasificaBinId
  tip?: string
}

export type ClasificaBin = {
  id: ClasificaBinId
  label: string
}

export type ClasificaRound = {
  id: string
  kind: ClasificaKind
  prompt: string
  help: string
  bins: ClasificaBin[]
  chips: ClasificaChip[]
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

const KIND_CYCLE: ClasificaKind[] = [
  'number',
  'gender',
  'article',
  'number',
  'gender',
  'gender-number',
]

function binForItem(item: WordsClasificaItem, kind: ClasificaKind): ClasificaBinId {
  if (kind === 'number') return item.number
  if (kind === 'gender') return item.gender
  if (kind === 'article') return item.article
  return `${item.gender}-${item.number}`
}

function binsForKind(kind: ClasificaKind): ClasificaBin[] {
  if (kind === 'number') {
    return [
      { id: 'sg', label: 'Singular' },
      { id: 'pl', label: 'Plural' },
    ]
  }
  if (kind === 'gender') {
    return [
      { id: 'm', label: 'Masculino' },
      { id: 'f', label: 'Femenino' },
    ]
  }
  if (kind === 'article') {
    return [
      { id: 'el', label: 'el' },
      { id: 'la', label: 'la' },
      { id: 'los', label: 'los' },
      { id: 'las', label: 'las' },
    ]
  }
  return [
    { id: 'm-sg', label: 'Masculino singular' },
    { id: 'f-sg', label: 'Femenino singular' },
    { id: 'm-pl', label: 'Masculino plural' },
    { id: 'f-pl', label: 'Femenino plural' },
  ]
}

function promptForKind(kind: ClasificaKind): { prompt: string; help: string } {
  if (kind === 'number') {
    return {
      prompt: '¿Singular o plural?',
      help: 'Singular = una; plural = varias. Clasifica cada palabra en su bando.',
    }
  }
  if (kind === 'gender') {
    return {
      prompt: '¿Masculino o femenino?',
      help: 'Solo nombres en singular. Masculino suele ir con el; femenino con la.',
    }
  }
  if (kind === 'article') {
    return {
      prompt: '¿Qué artículo le corresponde?',
      help: 'El artículo es el, la, los o las. Elige el que va delante del nombre.',
    }
  }
  return {
    prompt: '¿Género y número?',
    help: 'Clasifica por masculino/femenino y singular/plural a la vez.',
  }
}

function pickBalanced(
  items: WordsClasificaItem[],
  kind: ClasificaKind,
  count: number,
  random: () => number,
): WordsClasificaItem[] {
  const bins = binsForKind(kind)
  const byBin = new Map<string, WordsClasificaItem[]>()
  for (const b of bins) byBin.set(b.id, [])
  for (const item of shuffle(items, random)) {
    const id = binForItem(item, kind)
    const list = byBin.get(id)
    if (list) list.push(item)
  }
  const picked: WordsClasificaItem[] = []
  const seen = new Set<string>()
  let guard = 0
  while (picked.length < count && guard < count * 8) {
    guard += 1
    for (const b of bins) {
      if (picked.length >= count) break
      const list = byBin.get(b.id) ?? []
      const next = list.find((i) => !seen.has(i.id))
      if (!next) continue
      seen.add(next.id)
      picked.push(next)
    }
    if (picked.length === 0) break
    const anyLeft = bins.some((b) =>
      (byBin.get(b.id) ?? []).some((i) => !seen.has(i.id)),
    )
    if (!anyLeft) break
  }
  return shuffle(picked, random)
}

export function buildClasificaRound(
  kind: ClasificaKind,
  seed: number,
  poolSize = CLASIFICA_POOL_SIZE,
): ClasificaRound {
  const random = mulberry32(seed)
  // Género solo con singular: mezclar plurales confunde (lápices ≠ el/la).
  const pool =
    kind === 'gender'
      ? listClasificaItems().filter((i) => i.number === 'sg')
      : listClasificaItems()
  const picked = pickBalanced(pool, kind, poolSize, random)
  if (picked.length < 4) {
    throw new Error(`[clasifica] Pocas fichas para kind=${kind}`)
  }
  const { prompt, help } = promptForKind(kind)
  return {
    id: `clasifica-${kind}-${seed}`,
    kind,
    prompt,
    help,
    bins: binsForKind(kind),
    chips: shuffle(
      picked.map((item) => ({
        id: item.id,
        word: item.word,
        binId: binForItem(item, kind),
        tip: item.tip,
      })),
      random,
    ),
  }
}

export function buildClasificaSession(
  count = CLASIFICA_ROUNDS,
  seed = Date.now(),
): ClasificaRound[] {
  const out: ClasificaRound[] = []
  for (let i = 0; i < count; i += 1) {
    const kind = KIND_CYCLE[i % KIND_CYCLE.length]!
    out.push(buildClasificaRound(kind, seed + i * 9973))
  }
  return out
}

export function articleLabel(a: WordsClasificaArticle): string {
  return a
}
