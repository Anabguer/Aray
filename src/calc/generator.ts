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

/** Sumando 2–4 cifras (nivel ciclo medio). Evita sumas de una cifra. */
function twoThreeDigit(rand: () => number): number {
  const roll = rand()
  if (roll < 0.3) return randInt(rand, 20, 99)
  if (roll < 0.75) return randInt(rand, 100, 899)
  if (roll < 0.92) return randInt(rand, 900, 1999)
  return randInt(rand, 2000, 4999)
}

function buildAdd(seed: number, mode: CalcPlayMode = 'add'): CalcMcqQuestion {
  const rand = mulberry32(seed)
  const a = twoThreeDigit(rand)
  const b = twoThreeDigit(rand)
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
    prompt: '¿Cuánto es?',
    expression: `${a} + ${b}`,
    options,
    correctIndex: options.indexOf(String(correct)),
  }
}

function buildSub(seed: number, mode: CalcPlayMode = 'sub'): CalcMcqQuestion {
  const rand = mulberry32(seed)
  let a = twoThreeDigit(rand)
  let b = twoThreeDigit(rand)
  if (b >= a) {
    const t = a
    a = Math.max(b + randInt(rand, 5, 80), b + 1)
    b = t
  }
  // Preferir restas con “llevada” mental (unidades de b > unidades de a a veces).
  if (rand() < 0.35 && a > 50) {
    a = randInt(rand, 50, 999)
    b = randInt(rand, 15, Math.min(199, a - 1))
  }
  const correct = a - b
  const options = uniqueOptions(correct, [correct + 10, correct - 10, correct + 1, a + b, b], rand)
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
  const variant = rand() < 0.55 ? 'add' : rand() < 0.7 ? 'sub' : 'mul'
  if (variant === 'add') {
    const a = twoThreeDigit(rand)
    const missing = twoThreeDigit(rand)
    const total = a + missing
    const options = uniqueOptions(missing, [missing + 10, missing - 10, total, a], rand)
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
  if (variant === 'mul') {
    const a = randInt(rand, 2, 9)
    const missing = randInt(rand, 2, 10)
    const total = a * missing
    const options = uniqueOptions(missing, [missing + 1, missing - 1, total, a], rand)
    return {
      kind: 'mcq',
      id: `miss-mul-${seed}`,
      mode,
      prompt: '¿Qué número falta?',
      expression: `${a} × ? = ${total}`,
      options,
      correctIndex: options.indexOf(String(missing)),
    }
  }
  const result = twoThreeDigit(rand)
  const b = randInt(rand, 12, 199)
  const start = result + b
  const options = uniqueOptions(start, [start + 10, start - 10, result, b], rand)
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
  // Dobles útiles en 3.º: 15–99 (y a veces casi-doble).
  const n = randInt(rand, 15, 99)
  const almost = rand() < 0.35
  if (almost) {
    const correct = n + (n + 1)
    const options = uniqueOptions(correct, [n + n, correct + 1, correct - 1, n * 2 + 2], rand)
    return {
      kind: 'mcq',
      id: `dbl-near-${seed}`,
      mode,
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
    prompt: 'Doble',
    expression: `${n} + ${n}`,
    options,
    correctIndex: options.indexOf(String(correct)),
  }
}

function buildHalves(seed: number, mode: CalcPlayMode = 'halves'): CalcMcqQuestion {
  const rand = mulberry32(seed)
  const half = randInt(rand, 15, 99)
  const n = half * 2
  const options = uniqueOptions(half, [half + 1, half - 1, n, half + 10], rand)
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

/** Completar a 100 (ciclo medio). Hasta 10 solo residual (~8 %). */
function buildNear10(seed: number, mode: CalcPlayMode = 'near10'): CalcMcqQuestion {
  const rand = mulberry32(seed)
  const to100 = rand() < 0.92
  if (to100) {
    const a = randInt(rand, 1, 99)
    const b = 100 - a
    const options = uniqueOptions(b, [b + 1, b - 1, 100, a, 10 - (a % 10)], rand)
    return {
      kind: 'mcq',
      id: `n100-${seed}`,
      mode,
      prompt: 'Completa hasta 100',
      expression: `${a} + ? = 100`,
      options,
      correctIndex: options.indexOf(String(b)),
    }
  }
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
  // 3–4 cifras (temario hasta 9999).
  let left = rand() < 0.55 ? randInt(rand, 100, 999) : randInt(rand, 1000, 9999)
  let right = rand() < 0.55 ? randInt(rand, 100, 999) : randInt(rand, 1000, 9999)
  if (left === right) right = left + (rand() < 0.5 ? 1 : -1)
  // A veces números cercanos (mismo millar) para forzar valor posicional.
  if (rand() < 0.4) {
    left = randInt(rand, 1000, 9000)
    right = left + randInt(rand, -80, 80)
    if (right === left) right = left + 1
    if (right < 100) right = left + 10
  }
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
  const fourDigit = rand() < 0.65
  while (set.size < 4) {
    set.add(fourDigit ? randInt(rand, 1000, 9999) : randInt(rand, 100, 999))
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
  const kind = rand() < 0.4 ? 'mul' : rand() < 0.55 ? 'add' : rand() < 0.75 ? 'sub' : 'times10'
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
    const factor = rand() < 0.6 ? 10 : 100
    const real = a * factor
    isTrue = rand() < 0.45
    const shown = isTrue ? real : real + (rand() < 0.5 ? factor : -factor)
    expression = `${a} × ${factor} = ${shown}`
  } else if (kind === 'add') {
    const a = twoThreeDigit(rand)
    const b = twoThreeDigit(rand)
    const real = a + b
    isTrue = rand() < 0.45
    const shown = isTrue ? real : real + (rand() < 0.5 ? 10 : -10) * randInt(rand, 1, 3)
    expression = `${a} + ${b} = ${shown}`
  } else {
    let a = twoThreeDigit(rand)
    let b = randInt(rand, 15, Math.min(299, a - 1))
    if (b >= a) {
      a = b + randInt(rand, 10, 80)
    }
    const real = a - b
    isTrue = rand() < 0.45
    const shown = isTrue ? real : Math.max(0, real + (rand() < 0.5 ? 10 : -10))
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
