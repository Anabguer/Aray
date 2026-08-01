import { mulberry32, randInt, shuffle } from '@/math/rng'
import {
  type CalcCompareQuestion,
  type CalcDifficulty,
  type CalcMcqQuestion,
  type CalcOrderQuestion,
  type CalcPlayMode,
  type CalcQuestion,
  type CalcTrueFalseQuestion,
} from '@/calc/types'

function uniqueOptions(correct: number, distractors: number[], rand: () => number): string[] {
  const set = new Set<number>([correct])
  for (const d of distractors) {
    if (d !== correct && d >= 0) set.add(d)
  }
  let guard = 0
  while (set.size < 4 && guard < 40) {
    guard += 1
    const span = Math.max(3, Math.floor(correct / 20) || 3)
    const alt = correct + randInt(rand, -span, span)
    if (alt >= 0 && alt !== correct) set.add(alt)
  }
  const nums = shuffle([...set].slice(0, 4), rand)
  if (!nums.includes(correct)) nums[0] = correct
  return nums.map(String)
}

function pairForDifficulty(
  rand: () => number,
  difficulty: CalcDifficulty,
): [number, number] {
  if (difficulty === 'easy') {
    return [randInt(rand, 20, 99), randInt(rand, 20, 99)]
  }
  if (difficulty === 'medium') {
    return [randInt(rand, 100, 899), randInt(rand, 20, 299)]
  }
  return [randInt(rand, 900, 3999), randInt(rand, 100, 999)]
}

function buildAdd(
  seed: number,
  mode: CalcPlayMode = 'add',
  difficulty: CalcDifficulty = 'medium',
): CalcMcqQuestion {
  const rand = mulberry32(seed)
  const [a, b] = pairForDifficulty(rand, difficulty)
  const correct = a + b
  const options = uniqueOptions(
    correct,
    [correct + 10, correct - 10, correct + 1, a + b + 100, Math.abs(a - b)],
    rand,
  )
  return {
    kind: 'mcq',
    id: `add-${seed}`,
    mode,
    difficulty,
    prompt: '¿Cuánto es?',
    expression: `${a} + ${b}`,
    options,
    correctIndex: options.indexOf(String(correct)),
  }
}

function buildSub(
  seed: number,
  mode: CalcPlayMode = 'sub',
  difficulty: CalcDifficulty = 'medium',
): CalcMcqQuestion {
  const rand = mulberry32(seed)
  let [a, b] = pairForDifficulty(rand, difficulty)
  if (b >= a) {
    const t = a
    a = b + randInt(rand, 5, 80)
    b = t
  }
  if (difficulty === 'hard' && rand() < 0.5) {
    a = randInt(rand, 200, 999)
    b = randInt(rand, 15, Math.min(199, a - 1))
  }
  const correct = a - b
  const options = uniqueOptions(correct, [correct + 10, correct - 10, correct + 1, a + b, b], rand)
  return {
    kind: 'mcq',
    id: `sub-${seed}`,
    mode,
    difficulty,
    prompt: '¿Cuánto es?',
    expression: `${a} − ${b}`,
    options,
    correctIndex: options.indexOf(String(correct)),
  }
}

function buildMissing(
  seed: number,
  mode: CalcPlayMode = 'missing',
  difficulty: CalcDifficulty = 'medium',
): CalcMcqQuestion {
  const rand = mulberry32(seed)
  if (difficulty === 'easy' || (difficulty === 'medium' && rand() < 0.55)) {
    const pairDiff: CalcDifficulty = difficulty === 'easy' ? 'easy' : 'medium'
    const [a, missing] = pairForDifficulty(rand, pairDiff)
    const total = a + missing
    const options = uniqueOptions(missing, [missing + 10, missing - 10, total, a], rand)
    return {
      kind: 'mcq',
      id: `miss-add-${seed}`,
      mode,
      difficulty,
      prompt: '¿Qué número falta?',
      expression: `${a} + ? = ${total}`,
      options,
      correctIndex: options.indexOf(String(missing)),
    }
  }
  if (difficulty === 'hard' && rand() < 0.45) {
    const a = randInt(rand, 2, 9)
    const missing = randInt(rand, 2, 10)
    const total = a * missing
    const options = uniqueOptions(missing, [missing + 1, missing - 1, total, a], rand)
    return {
      kind: 'mcq',
      id: `miss-mul-${seed}`,
      mode,
      difficulty,
      prompt: '¿Qué número falta?',
      expression: `${a} × ? = ${total}`,
      options,
      correctIndex: options.indexOf(String(missing)),
    }
  }
  const result = pairForDifficulty(rand, difficulty === 'hard' ? 'hard' : 'medium')[0]!
  const b = randInt(rand, 12, difficulty === 'hard' ? 299 : 99)
  const start = result + b
  const options = uniqueOptions(start, [start + 10, start - 10, result, b], rand)
  return {
    kind: 'mcq',
    id: `miss-sub-${seed}`,
    mode,
    difficulty,
    prompt: '¿Qué número falta?',
    expression: `? − ${b} = ${result}`,
    options,
    correctIndex: options.indexOf(String(start)),
  }
}

function buildDoubles(
  seed: number,
  mode: CalcPlayMode = 'doubles',
  difficulty: CalcDifficulty = 'medium',
): CalcMcqQuestion {
  const rand = mulberry32(seed)
  const n =
    difficulty === 'easy'
      ? randInt(rand, 15, 40)
      : difficulty === 'medium'
        ? randInt(rand, 25, 70)
        : randInt(rand, 45, 99)
  const almost = difficulty !== 'easy' && rand() < 0.35
  if (almost) {
    const correct = n + (n + 1)
    const options = uniqueOptions(correct, [n + n, correct + 1, correct - 1, n * 2 + 2], rand)
    return {
      kind: 'mcq',
      id: `dbl-near-${seed}`,
      mode,
      difficulty,
      prompt: 'Casi doble',
      expression: `${n} + ${n + 1}`,
      options,
      correctIndex: options.indexOf(String(correct)),
    }
  }
  const correct = n + n
  const options = uniqueOptions(correct, [correct + 1, correct - 1, n, correct + 10], rand)
  return {
    kind: 'mcq',
    id: `dbl-${seed}`,
    mode,
    difficulty,
    prompt: 'Doble',
    expression: `${n} + ${n}`,
    options,
    correctIndex: options.indexOf(String(correct)),
  }
}

function buildHalves(
  seed: number,
  mode: CalcPlayMode = 'halves',
  difficulty: CalcDifficulty = 'medium',
): CalcMcqQuestion {
  const rand = mulberry32(seed)
  const half =
    difficulty === 'easy'
      ? randInt(rand, 15, 40)
      : difficulty === 'medium'
        ? randInt(rand, 25, 70)
        : randInt(rand, 45, 99)
  const n = half * 2
  const options = uniqueOptions(half, [half + 1, half - 1, n, half + 10], rand)
  return {
    kind: 'mcq',
    id: `half-${seed}`,
    mode,
    difficulty,
    prompt: '¿Mitad de…?',
    expression: String(n),
    options,
    correctIndex: options.indexOf(String(half)),
  }
}

/**
 * Completar hasta 10 / 100 (3.º):
 * - Hasta 100: ambos sumandos en [15, 85] (nunca trivial tipo 6 + ? = 100).
 * - Hasta 10: solo easy residual; sumando mostrado en [2, 8].
 */
export function buildNear10(
  seed: number,
  mode: CalcPlayMode = 'near10',
  difficulty: CalcDifficulty = 'medium',
): CalcMcqQuestion {
  const rand = mulberry32(seed)
  const to10 = difficulty === 'easy' && rand() < 0.35
  if (to10) {
    const a = randInt(rand, 2, 8)
    const b = 10 - a
    const options = uniqueOptions(b, [b + 1, b - 1, 10, a], rand)
    return {
      kind: 'mcq',
      id: `n10-${seed}`,
      mode,
      difficulty: 'easy',
      prompt: 'Completa hasta 10',
      expression: `${a} + ? = 10`,
      options,
      correctIndex: options.indexOf(String(b)),
    }
  }

  // Hasta 100: complementos equilibrados para 3.º.
  const a =
    difficulty === 'easy'
      ? randInt(rand, 20, 40)
      : difficulty === 'hard'
        ? randInt(rand, 15, 85)
        : randInt(rand, 25, 75)
  const b = 100 - a
  // Garantía: ambos en [15, 85]
  if (a < 15 || a > 85 || b < 15 || b > 85) {
    const safeA = randInt(rand, 25, 75)
    const safeB = 100 - safeA
    const options = uniqueOptions(safeB, [safeB + 1, safeB - 1, 100, safeA], rand)
    return {
      kind: 'mcq',
      id: `n100-${seed}`,
      mode,
      difficulty,
      prompt: 'Completa hasta 100',
      expression: `${safeA} + ? = 100`,
      options,
      correctIndex: options.indexOf(String(safeB)),
    }
  }
  const options = uniqueOptions(b, [b + 1, b - 1, 100, a, 10 - (a % 10)], rand)
  return {
    kind: 'mcq',
    id: `n100-${seed}`,
    mode,
    difficulty,
    prompt: 'Completa hasta 100',
    expression: `${a} + ? = 100`,
    options,
    correctIndex: options.indexOf(String(b)),
  }
}

function buildCompare(
  seed: number,
  mode: CalcPlayMode = 'compare',
  difficulty: CalcDifficulty = 'medium',
): CalcCompareQuestion {
  const rand = mulberry32(seed)
  let left: number
  let right: number
  if (difficulty === 'easy') {
    left = randInt(rand, 100, 499)
    right = randInt(rand, 100, 499)
  } else if (difficulty === 'medium') {
    left = rand() < 0.5 ? randInt(rand, 100, 999) : randInt(rand, 1000, 4999)
    right = rand() < 0.5 ? randInt(rand, 100, 999) : randInt(rand, 1000, 4999)
  } else {
    left = randInt(rand, 1000, 9000)
    right = left + randInt(rand, -80, 80)
  }
  if (left === right) right = left + (rand() < 0.5 ? 1 : -1)
  if (right < 100) right = left + 10
  return {
    kind: 'compare',
    id: `cmp-${seed}`,
    mode: mode === 'mix' ? 'mix' : 'compare',
    difficulty,
    prompt: '¿Cuál es mayor?',
    left,
    right,
    greater: left > right ? 'left' : 'right',
  }
}

function buildOrder(
  seed: number,
  mode: CalcPlayMode = 'order',
  difficulty: CalcDifficulty = 'medium',
): CalcOrderQuestion {
  const rand = mulberry32(seed)
  const set = new Set<number>()
  const fourDigit = difficulty !== 'easy'
  while (set.size < 4) {
    if (difficulty === 'easy') set.add(randInt(rand, 100, 999))
    else if (difficulty === 'medium') {
      set.add(fourDigit && rand() < 0.5 ? randInt(rand, 1000, 9999) : randInt(rand, 100, 999))
    } else set.add(randInt(rand, 1000, 9999))
  }
  const items = shuffle([...set], rand)
  const answer = [...items].sort((a, b) => a - b)
  return {
    kind: 'order',
    id: `ord-${seed}`,
    mode: mode === 'mix' ? 'mix' : 'order',
    difficulty,
    prompt: 'De menor a mayor',
    items,
    answer,
  }
}

function buildTrueFalse(
  seed: number,
  mode: CalcPlayMode = 'truefalse',
  difficulty: CalcDifficulty = 'medium',
): CalcTrueFalseQuestion {
  const rand = mulberry32(seed)
  const kind =
    difficulty === 'easy'
      ? rand() < 0.5
        ? 'add'
        : 'mul'
      : rand() < 0.35
        ? 'mul'
        : rand() < 0.55
          ? 'add'
          : rand() < 0.75
            ? 'sub'
            : 'times10'
  let expression: string
  let isTrue: boolean
  if (kind === 'mul') {
    const a = randInt(rand, 2, 9)
    const b = randInt(rand, 2, 10)
    const real = a * b
    isTrue = rand() < 0.45
    const shown = isTrue ? real : real + (rand() < 0.5 ? 1 : -1) * randInt(rand, 1, 4)
    expression = `${a} × ${b} = ${shown}`
  } else if (kind === 'times10') {
    const a = randInt(rand, 12, 99)
    const factor = difficulty === 'hard' ? 100 : rand() < 0.6 ? 10 : 100
    const real = a * factor
    isTrue = rand() < 0.45
    const shown = isTrue ? real : real + (rand() < 0.5 ? factor : -factor)
    expression = `${a} × ${factor} = ${shown}`
  } else if (kind === 'add') {
    const [a, b] = pairForDifficulty(rand, difficulty)
    const real = a + b
    isTrue = rand() < 0.45
    const shown = isTrue ? real : real + (rand() < 0.5 ? 10 : -10) * randInt(rand, 1, 3)
    expression = `${a} + ${b} = ${shown}`
  } else {
    let [a, b] = pairForDifficulty(rand, difficulty)
    if (b >= a) a = b + randInt(rand, 10, 80)
    const real = a - b
    isTrue = rand() < 0.45
    const shown = isTrue ? real : Math.max(0, real + (rand() < 0.5 ? 10 : -10))
    expression = `${a} − ${b} = ${shown}`
  }
  return {
    kind: 'truefalse',
    id: `tf-${seed}`,
    mode: mode === 'mix' ? 'mix' : 'truefalse',
    difficulty,
    prompt: '¿Es correcto?',
    expression,
    isTrue,
  }
}

type Builder = (seed: number, mode: CalcPlayMode, d: CalcDifficulty) => CalcQuestion

const MODE_BUILDERS: Record<Exclude<CalcPlayMode, 'mix'>, Builder> = {
  add: buildAdd,
  sub: buildSub,
  missing: buildMissing,
  doubles: buildDoubles,
  halves: buildHalves,
  near10: buildNear10,
  compare: buildCompare,
  order: buildOrder,
  truefalse: buildTrueFalse,
}

const MIX_MODES: Array<Exclude<CalcPlayMode, 'mix'>> = [
  'add',
  'sub',
  'missing',
  'doubles',
  'halves',
  'near10',
  'compare',
  'order',
  'truefalse',
]

/** Elige dificultad evitando rachas extremas. */
export function pickBalancedDifficulty(
  previous: CalcDifficulty[],
  rand: () => number,
): CalcDifficulty {
  const last = previous[previous.length - 1]
  const last2 = previous[previous.length - 2]
  const weights: Record<CalcDifficulty, number> = {
    easy: 28,
    medium: 44,
    hard: 28,
  }
  if (last === 'hard') weights.hard = 6
  if (last === 'hard' && last2 === 'hard') weights.hard = 0
  if (last === 'easy' && last2 === 'easy') weights.easy = 6
  if (last === 'easy' && last2 === 'easy' && previous[previous.length - 3] === 'easy') {
    weights.easy = 0
  }
  const total = weights.easy + weights.medium + weights.hard
  let ticket = rand() * total
  for (const d of ['easy', 'medium', 'hard'] as CalcDifficulty[]) {
    ticket -= weights[d]
    if (ticket <= 0) return d
  }
  return 'medium'
}

export function buildCalcQuestion(
  mode: CalcPlayMode,
  seed: number,
  difficulty: CalcDifficulty = 'medium',
): CalcQuestion {
  if (mode === 'mix') {
    const rand = mulberry32(seed)
    const pick = MIX_MODES[Math.floor(rand() * MIX_MODES.length)]!
    return MODE_BUILDERS[pick](seed, 'mix', difficulty)
  }
  return MODE_BUILDERS[mode](seed, mode, difficulty)
}

/**
 * Cola para partida a tiempo: dificultades equilibradas
 * (~28/44/28) sin rachas de 3 fáciles ni 2 difíciles seguidas.
 */
export function buildCalcQueue(mode: CalcPlayMode, count: number, seed: number): CalcQuestion[] {
  const out: CalcQuestion[] = []
  const difficulties: CalcDifficulty[] = []
  for (let i = 0; i < count; i += 1) {
    const itemSeed = seed + i * 7919
    const rand = mulberry32(itemSeed ^ 0x9e3779b9)
    const difficulty = pickBalancedDifficulty(difficulties, rand)
    difficulties.push(difficulty)
    out.push(buildCalcQuestion(mode, itemSeed, difficulty))
  }
  return out
}

export function isOrderCorrect(picked: number[], answer: number[]): boolean {
  if (picked.length !== answer.length) return false
  return picked.every((n, i) => n === answer[i])
}

/** Propiedad: near10 nunca deja sumandos triviales hacia 100. */
export function assertNear10Sane(q: CalcMcqQuestion): void {
  const m100 = /(\d+) \+ \? = 100$/.exec(q.expression ?? '')
  const m10 = /(\d+) \+ \? = 10$/.exec(q.expression ?? '')
  if (m100) {
    const a = Number(m100[1])
    const b = 100 - a
    if (a < 15 || a > 85 || b < 15 || b > 85) {
      throw new Error(`near100 trivial: ${q.expression}`)
    }
    if (q.options[q.correctIndex] !== String(b)) {
      throw new Error(`near100 wrong answer: ${q.expression}`)
    }
  } else if (m10) {
    const a = Number(m10[1])
    if (a < 2 || a > 8) throw new Error(`near10 out of range: ${q.expression}`)
    if (q.options[q.correctIndex] !== String(10 - a)) {
      throw new Error(`near10 wrong answer: ${q.expression}`)
    }
  } else {
    throw new Error(`near10 unexpected: ${q.expression}`)
  }
  if (new Set(q.options).size !== 4) throw new Error('options not unique')
}
