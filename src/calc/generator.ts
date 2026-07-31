import {
  type CalcCompareQuestion,
  type CalcMcqQuestion,
  type CalcOrderQuestion,
  type CalcPlayMode,
  type CalcQuestion,
  type CalcTrueFalseQuestion,
} from '@/calc/types'

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

function randInt(rand: () => number, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1))
}

function uniqueOptions(correct: number, distractors: number[], rand: () => number): string[] {
  const set = new Set<number>([correct])
  for (const d of distractors) {
    if (d !== correct && d >= 0) set.add(d)
  }
  let guard = 0
  while (set.size < 4 && guard < 30) {
    guard += 1
    const alt = correct + randInt(rand, -6, 6)
    if (alt >= 0 && alt !== correct) set.add(alt)
  }
  const nums = shuffle([...set].slice(0, 4), rand)
  if (!nums.includes(correct)) nums[0] = correct
  return nums.map(String)
}

function buildAdd(seed: number, mode: CalcPlayMode = 'add'): CalcMcqQuestion {
  const rand = mulberry32(seed)
  const a = randInt(rand, 2, 12)
  const b = randInt(rand, 2, 12)
  const correct = a + b
  const options = uniqueOptions(correct, [correct + 1, correct - 1, a + b + 2, Math.abs(a - b)], rand)
  return {
    kind: 'mcq',
    id: `add-${seed}`,
    mode,
    prompt: '¿Cuánto es?',
    expression: `${a} + ${b}`,
    options,
    correctIndex: options.indexOf(String(correct)),
  }
}

function buildSub(seed: number, mode: CalcPlayMode = 'sub'): CalcMcqQuestion {
  const rand = mulberry32(seed)
  const a = randInt(rand, 8, 20)
  const b = randInt(rand, 1, Math.min(9, a - 1))
  const correct = a - b
  const options = uniqueOptions(correct, [correct + 1, correct - 1, a + b, b], rand)
  return {
    kind: 'mcq',
    id: `sub-${seed}`,
    mode,
    prompt: '¿Cuánto es?',
    expression: `${a} − ${b}`,
    options,
    correctIndex: options.indexOf(String(correct)),
  }
}

function buildMissing(seed: number, mode: CalcPlayMode = 'missing'): CalcMcqQuestion {
  const rand = mulberry32(seed)
  const variant = rand() < 0.5 ? 'add' : 'sub'
  if (variant === 'add') {
    const a = randInt(rand, 3, 12)
    const total = a + randInt(rand, 3, 12)
    const missing = total - a
    const options = uniqueOptions(missing, [missing + 1, missing - 1, total, a], rand)
    return {
      kind: 'mcq',
      id: `miss-add-${seed}`,
      mode,
      prompt: '¿Qué número falta?',
      expression: `${a} + ? = ${total}`,
      options,
      correctIndex: options.indexOf(String(missing)),
    }
  }
  const result = randInt(rand, 3, 12)
  const b = randInt(rand, 2, 9)
  const start = result + b
  const options = uniqueOptions(start, [start + 1, start - 1, result, b], rand)
  return {
    kind: 'mcq',
    id: `miss-sub-${seed}`,
    mode,
    prompt: '¿Qué número falta?',
    expression: `? − ${b} = ${result}`,
    options,
    correctIndex: options.indexOf(String(start)),
  }
}

function buildDoubles(seed: number, mode: CalcPlayMode = 'doubles'): CalcMcqQuestion {
  const rand = mulberry32(seed)
  const n = randInt(rand, 2, 12)
  const correct = n + n
  const options = uniqueOptions(correct, [correct + 1, correct - 1, n, n * 2 + 2], rand)
  return {
    kind: 'mcq',
    id: `dbl-${seed}`,
    mode,
    prompt: 'Doble',
    expression: `${n} + ${n}`,
    options,
    correctIndex: options.indexOf(String(correct)),
  }
}

function buildHalves(seed: number, mode: CalcPlayMode = 'halves'): CalcMcqQuestion {
  const rand = mulberry32(seed)
  const half = randInt(rand, 2, 12)
  const n = half * 2
  const options = uniqueOptions(half, [half + 1, half - 1, n, half + 2], rand)
  return {
    kind: 'mcq',
    id: `half-${seed}`,
    mode,
    prompt: '¿Mitad de…?',
    expression: String(n),
    options,
    correctIndex: options.indexOf(String(half)),
  }
}

/** Pares que suman 10 (completar decenas). */
function buildNear10(seed: number, mode: CalcPlayMode = 'near10'): CalcMcqQuestion {
  const rand = mulberry32(seed)
  const a = randInt(rand, 1, 9)
  const b = 10 - a
  const options = uniqueOptions(b, [b + 1, b - 1, 10, a], rand)
  return {
    kind: 'mcq',
    id: `n10-${seed}`,
    mode,
    prompt: 'Completa hasta 10',
    expression: `${a} + ? = 10`,
    options,
    correctIndex: options.indexOf(String(b)),
  }
}

function buildCompare(seed: number, mode: CalcPlayMode = 'compare'): CalcCompareQuestion {
  const rand = mulberry32(seed)
  let left = randInt(rand, 5, 99)
  let right = randInt(rand, 5, 99)
  if (left === right) right = left + (rand() < 0.5 ? 1 : -1)
  return {
    kind: 'compare',
    id: `cmp-${seed}`,
    mode: mode === 'mix' ? 'mix' : 'compare',
    prompt: '¿Cuál es mayor?',
    left,
    right,
    greater: left > right ? 'left' : 'right',
  }
}

function buildOrder(seed: number, mode: CalcPlayMode = 'order'): CalcOrderQuestion {
  const rand = mulberry32(seed)
  const set = new Set<number>()
  while (set.size < 4) {
    set.add(randInt(rand, 1, 50))
  }
  const items = shuffle([...set], rand)
  const answer = [...items].sort((a, b) => a - b)
  return {
    kind: 'order',
    id: `ord-${seed}`,
    mode: mode === 'mix' ? 'mix' : 'order',
    prompt: 'De menor a mayor',
    items,
    answer,
  }
}

function buildTrueFalse(seed: number, mode: CalcPlayMode = 'truefalse'): CalcTrueFalseQuestion {
  const rand = mulberry32(seed)
  const kind = rand() < 0.55 ? 'mul' : rand() < 0.5 ? 'add' : 'sub'
  let expression: string
  let isTrue: boolean
  if (kind === 'mul') {
    const a = randInt(rand, 2, 9)
    const b = randInt(rand, 2, 9)
    const real = a * b
    isTrue = rand() < 0.45
    const shown = isTrue ? real : real + (rand() < 0.5 ? 1 : -1) * randInt(rand, 1, 3)
    expression = `${a} × ${b} = ${shown}`
  } else if (kind === 'add') {
    const a = randInt(rand, 3, 15)
    const b = randInt(rand, 3, 15)
    const real = a + b
    isTrue = rand() < 0.45
    const shown = isTrue ? real : real + randInt(rand, 1, 3)
    expression = `${a} + ${b} = ${shown}`
  } else {
    const a = randInt(rand, 10, 20)
    const b = randInt(rand, 2, 9)
    const real = a - b
    isTrue = rand() < 0.45
    const shown = isTrue ? real : Math.max(0, real + (rand() < 0.5 ? 1 : -1))
    expression = `${a} − ${b} = ${shown}`
  }
  return {
    kind: 'truefalse',
    id: `tf-${seed}`,
    mode: mode === 'mix' ? 'mix' : 'truefalse',
    prompt: '¿Es correcto?',
    expression,
    isTrue,
  }
}

const MIX_BUILDERS: Array<(seed: number) => CalcQuestion> = [
  (s) => buildAdd(s, 'mix'),
  (s) => buildSub(s, 'mix'),
  (s) => buildMissing(s, 'mix'),
  (s) => buildDoubles(s, 'mix'),
  (s) => buildHalves(s, 'mix'),
  (s) => buildNear10(s, 'mix'),
  (s) => buildCompare(s, 'mix'),
  (s) => buildOrder(s, 'mix'),
  (s) => buildTrueFalse(s, 'mix'),
]

export function buildCalcQuestion(mode: CalcPlayMode, seed: number): CalcQuestion {
  switch (mode) {
    case 'add':
      return buildAdd(seed)
    case 'sub':
      return buildSub(seed)
    case 'missing':
      return buildMissing(seed)
    case 'doubles':
      return buildDoubles(seed)
    case 'halves':
      return buildHalves(seed)
    case 'near10':
      return buildNear10(seed)
    case 'compare':
      return buildCompare(seed)
    case 'order':
      return buildOrder(seed)
    case 'truefalse':
      return buildTrueFalse(seed)
    case 'mix': {
      const rand = mulberry32(seed)
      const builder = MIX_BUILDERS[Math.floor(rand() * MIX_BUILDERS.length)]!
      return builder(seed)
    }
  }
}

/** Cola larga para partida a tiempo (se corta al acabar el reloj). */
export function buildCalcQueue(mode: CalcPlayMode, count: number, seed: number): CalcQuestion[] {
  const out: CalcQuestion[] = []
  for (let i = 0; i < count; i += 1) {
    out.push(buildCalcQuestion(mode, seed + i * 7919))
  }
  return out
}

export function isOrderCorrect(picked: number[], answer: number[]): boolean {
  if (picked.length !== answer.length) return false
  return picked.every((n, i) => n === answer[i])
}
