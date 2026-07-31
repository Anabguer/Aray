import {
  ALPHABET,
  ALPHABET_ROUND_SIZE,
  PRACTICE_WORDS,
  type AlphabetDifficulty,
  type AlphabetDirection,
  type AlphabetLetter,
  type AlphabetPlayMode,
  type AlphabetQuestion,
  type NeighborDirection,
  type NeighborQuestion,
  type MissingLetterQuestion,
  type OrderLettersQuestion,
  type OrderWordsQuestion,
  type ScatterPos,
} from '@/alphabet/types'

function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(items: T[], rand: () => number): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

export function letterIndex(letter: string): number {
  return ALPHABET.indexOf(letter.toUpperCase() as AlphabetLetter)
}

export function compareLetters(a: string, b: string): number {
  return letterIndex(a) - letterIndex(b)
}

export function compareWords(a: string, b: string): number {
  return a.localeCompare(b, 'es', { sensitivity: 'base' })
}

function difficultyForStep(step: number, total: number): AlphabetDifficulty {
  const t = step / Math.max(total - 1, 1)
  if (t < 0.34) return 1
  if (t < 0.67) return 2
  return 3
}

/** Zona del abecedario según dificultad: finales = más duro. */
function pickTargetIndex(difficulty: AlphabetDifficulty, rand: () => number): number {
  const last = ALPHABET.length - 1
  if (difficulty === 1) {
    return Math.floor(rand() * 12) // A–L
  }
  if (difficulty === 2) {
    return 10 + Math.floor(rand() * 10) // K–T approx
  }
  return 16 + Math.floor(rand() * (last - 15)) // Q–Z + Ñ zone
}

function clampIndex(i: number): number {
  return Math.max(0, Math.min(ALPHABET.length - 1, i))
}

function pickDistractLetters(
  answer: AlphabetLetter,
  count: number,
  rand: () => number,
  nearBias = true,
): AlphabetLetter[] {
  const ansIdx = letterIndex(answer)
  const pool: AlphabetLetter[] = []
  const near = [-3, -2, -1, 1, 2, 3]
    .map((d) => ALPHABET[clampIndex(ansIdx + d)])
    .filter((l): l is AlphabetLetter => Boolean(l) && l !== answer)
  const far = ALPHABET.filter((l) => l !== answer && !near.includes(l))
  const preferred = nearBias ? [...shuffle(near, rand), ...shuffle(far, rand)] : shuffle([...ALPHABET], rand)
  for (const letter of preferred) {
    if (letter === answer) continue
    if (!pool.includes(letter)) pool.push(letter)
    if (pool.length >= count) break
  }
  return pool.slice(0, count)
}

export function buildMissingQuestion(
  difficulty: AlphabetDifficulty,
  seed: number,
): MissingLetterQuestion {
  const rand = mulberry32(seed)
  const chainLen = difficulty === 1 ? 4 : difficulty === 2 ? 5 : 6
  const optionCount = difficulty === 1 ? 4 : difficulty === 2 ? 5 : 6
  let center = pickTargetIndex(difficulty, rand)
  // Necesitamos hueco no en extremos extremos del alfabeto
  const half = Math.floor((chainLen - 1) / 2)
  center = clampIndex(Math.max(half, Math.min(ALPHABET.length - 1 - (chainLen - 1 - half), center)))
  const start = clampIndex(center - half)
  const sequence: (AlphabetLetter | null)[] = []
  for (let i = 0; i < chainLen; i += 1) {
    sequence.push(ALPHABET[start + i]!)
  }
  // Hueco: preferir centro; en difícil puede ser cualquier interior
  let blankIndex =
    difficulty === 3
      ? 1 + Math.floor(rand() * (chainLen - 2))
      : Math.floor(chainLen / 2)
  blankIndex = Math.max(1, Math.min(chainLen - 2, blankIndex))
  const answer = sequence[blankIndex]!
  sequence[blankIndex] = null
  const distractors = pickDistractLetters(answer, optionCount - 1, rand, true)
  const options = shuffle([answer, ...distractors], rand)
  return {
    kind: 'missing',
    id: `missing-${seed}`,
    sequence,
    blankIndex,
    answer,
    options,
    difficulty,
  }
}

export function buildNeighborQuestion(
  difficulty: AlphabetDifficulty,
  seed: number,
): NeighborQuestion {
  const rand = mulberry32(seed)
  const direction: NeighborDirection = rand() < 0.5 ? 'next' : 'prev'
  let idx = pickTargetIndex(difficulty, rand)
  if (direction === 'next' && idx >= ALPHABET.length - 1) idx = ALPHABET.length - 2
  if (direction === 'prev' && idx <= 0) idx = 1
  const letter = ALPHABET[idx]!
  const answer = direction === 'next' ? ALPHABET[idx + 1]! : ALPHABET[idx - 1]!
  const optionCount = difficulty === 1 ? 4 : difficulty === 2 ? 5 : 6
  const distractors = pickDistractLetters(answer, optionCount - 1, rand, true)
  // Evitar poner la letra mostrada como distractor confuso si cabe
  const cleaned = distractors.filter((d) => d !== letter)
  while (cleaned.length < optionCount - 1) {
    const extra = ALPHABET[Math.floor(rand() * ALPHABET.length)]!
    if (extra !== answer && extra !== letter && !cleaned.includes(extra)) cleaned.push(extra)
  }
  const options = shuffle([answer, ...cleaned.slice(0, optionCount - 1)], rand)
  return {
    kind: 'neighbor',
    id: `neighbor-${seed}`,
    letter,
    direction,
    answer,
    options,
    difficulty,
  }
}

export function buildOrderLettersQuestion(
  difficulty: AlphabetDifficulty,
  seed: number,
  forcedDirection?: AlphabetDirection,
): OrderLettersQuestion {
  const rand = mulberry32(seed)
  const direction: AlphabetDirection =
    forcedDirection ?? (difficulty >= 3 && rand() < 0.45 ? 'desc' : 'asc')
  const count = difficulty === 1 ? 6 : difficulty === 2 ? 8 : 10
  const startMax = ALPHABET.length - count
  // Dificultad alta empuja hacia el final del abecedario
  let start: number
  if (difficulty === 1) {
    start = Math.floor(rand() * Math.min(10, startMax + 1))
  } else if (difficulty === 2) {
    start = Math.floor(rand() * (startMax + 1))
  } else {
    start = Math.max(0, startMax - Math.floor(rand() * 8))
  }
  const consecutive = ALPHABET.slice(start, start + count) as AlphabetLetter[]
  // A veces letras no consecutivas (más difícil)
  let picked = consecutive
  if (difficulty >= 2 && rand() < 0.55) {
    const span = Math.min(ALPHABET.length, count + difficulty * 3)
    const spanStart = clampIndex(
      difficulty === 3
        ? ALPHABET.length - span
        : Math.floor(rand() * Math.max(1, ALPHABET.length - span + 1)),
    )
    const pool = ALPHABET.slice(spanStart, spanStart + span) as AlphabetLetter[]
    picked = shuffle(pool, rand).slice(0, count)
  }
  const answer =
    direction === 'asc'
      ? [...picked].sort(compareLetters) as AlphabetLetter[]
      : ([...picked].sort(compareLetters) as AlphabetLetter[]).reverse()
  let letters = shuffle(picked, rand)
  // Evitar que ya salga ordenado
  let guard = 0
  while (guard < 8 && letters.every((l, i) => l === answer[i])) {
    letters = shuffle(picked, rand)
    guard += 1
  }
  return {
    kind: 'order-letters',
    id: `order-letters-${seed}`,
    letters,
    answer,
    direction,
    difficulty,
  }
}

function scatterPositions(count: number, rand: () => number): ScatterPos[] {
  const cols = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / cols)
  const positions: ScatterPos[] = []
  for (let i = 0; i < count; i += 1) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const cellW = 100 / cols
    const cellH = 100 / rows
    const jitterX = (rand() - 0.5) * cellW * 0.45
    const jitterY = (rand() - 0.5) * cellH * 0.4
    positions.push({
      x: Math.max(4, Math.min(88, cellW * col + cellW * 0.15 + jitterX)),
      y: Math.max(4, Math.min(78, cellH * row + cellH * 0.12 + jitterY)),
      rotate: Math.round((rand() - 0.5) * 18),
    })
  }
  return shuffle(positions, rand)
}

export function buildOrderWordsQuestion(
  difficulty: AlphabetDifficulty,
  seed: number,
  forcedDirection?: AlphabetDirection,
): OrderWordsQuestion {
  const rand = mulberry32(seed)
  const direction: AlphabetDirection =
    forcedDirection ?? (difficulty >= 2 && rand() < 0.4 ? 'desc' : 'asc')
  const count = difficulty === 1 ? 6 : difficulty === 2 ? 8 : 10
  // Preferir palabras con inicial distinta
  const pool = shuffle([...PRACTICE_WORDS], rand)
  const chosen: string[] = []
  const usedInitial = new Set<string>()
  for (const word of pool) {
    const initial = word[0]!.toLowerCase()
    if (usedInitial.has(initial)) continue
    usedInitial.add(initial)
    chosen.push(word)
    if (chosen.length >= count) break
  }
  for (const word of pool) {
    if (chosen.length >= count) break
    if (!chosen.includes(word)) chosen.push(word)
  }
  const answer =
    direction === 'asc'
      ? [...chosen].sort(compareWords)
      : [...chosen].sort(compareWords).reverse()
  let words = shuffle(chosen, rand)
  let guard = 0
  while (guard < 8 && words.every((w, i) => w === answer[i])) {
    words = shuffle(chosen, rand)
    guard += 1
  }
  return {
    kind: 'order-words',
    id: `order-words-${seed}`,
    words,
    answer,
    direction,
    positions: scatterPositions(words.length, rand),
    difficulty,
  }
}

const MODE_BUILDERS: Record<
  Exclude<AlphabetPlayMode, 'random'>,
  (difficulty: AlphabetDifficulty, seed: number) => AlphabetQuestion
> = {
  missing: buildMissingQuestion,
  neighbor: buildNeighborQuestion,
  'order-letters': buildOrderLettersQuestion,
  'order-words': buildOrderWordsQuestion,
}

const FIXED_KINDS: Exclude<AlphabetPlayMode, 'random'>[] = [
  'missing',
  'neighbor',
  'order-letters',
  'order-words',
]

export function buildAlphabetRound(
  mode: AlphabetPlayMode,
  count = ALPHABET_ROUND_SIZE,
  seed = Date.now(),
): AlphabetQuestion[] {
  const rand = mulberry32(seed)
  const queue: AlphabetQuestion[] = []
  for (let i = 0; i < count; i += 1) {
    const difficulty = difficultyForStep(i, count)
    const kind =
      mode === 'random'
        ? FIXED_KINDS[Math.floor(rand() * FIXED_KINDS.length)]!
        : mode
    const qSeed = seed + (i + 1) * 9973 + letterIndex(ALPHABET[i % ALPHABET.length]!) * 13
    queue.push(MODE_BUILDERS[kind](difficulty, qSeed))
  }
  return queue
}

export function isOrderComplete(
  picked: string[],
  answer: string[],
): 'progress' | 'correct' | 'wrong' {
  if (picked.length === 0) return 'progress'
  const last = picked.length - 1
  if (picked[last] !== answer[last]) return 'wrong'
  if (picked.length === answer.length) return 'correct'
  return 'progress'
}
