import {
  SPELL_BANK,
  SPELL_CONTEXTS,
  SPELL_ROUND_SIZE,
  type SpellContext,
  type SpellMcqQuestion,
  type SpellPlayMode,
  type SpellQuestion,
  type SpellWord,
} from '@/spelling/types'

function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

const BANK_WORDS = new Set(SPELL_BANK.map((w) => w.word.toLowerCase()))

function pickWord(rand: () => number, used: Set<string>): SpellWord {
  const pool = SPELL_BANK.filter((w) => !used.has(w.word))
  const list = pool.length > 0 ? pool : SPELL_BANK
  return list[Math.floor(rand() * list.length)]!
}

function pickContext(rand: () => number, used: Set<string>): SpellContext {
  const pool = SPELL_CONTEXTS.filter((c) => !used.has(c.id))
  const list = pool.length > 0 ? pool : SPELL_CONTEXTS
  return list[Math.floor(rand() * list.length)]!
}

/** 1 bien + 3 confusiones reales de esa palabra. */
function wordOptions(w: SpellWord, rand: () => number): string[] {
  const wrongs = w.distractors.filter(
    (d) => d.toLowerCase() !== w.word.toLowerCase() && !BANK_WORDS.has(d.toLowerCase()),
  )
  const set = new Set<string>([w.word, ...wrongs])
  let n = 0
  while (set.size < 4 && n < 6) {
    n += 1
    // Confusiones suaves tipográficas, no “k”
    const extra =
      n === 1 ? w.word.replace(/rr/i, 'r') : n === 2 ? w.word.replace(/^h/i, '') : `${w.word}s`
    if (extra && extra !== w.word && !BANK_WORDS.has(extra.toLowerCase())) set.add(extra)
  }
  const opts = shuffle([...set].slice(0, 4), rand)
  if (!opts.includes(w.word)) opts[0] = w.word
  return opts
}

/** Digrafos ortográficos que cuentan como una sola “letra” en el hueco. */
const SPELL_DIGRAPHS = ['ll', 'rr'] as const

/**
 * Unidad a rellenar en “letra que falta”: ll/rr juntas, no L_L ni R_R.
 */
export function hardUnitAt(word: string, index: number): { start: number; unit: string } {
  const i = Math.max(0, Math.min(word.length - 1, index))
  const lower = word.toLowerCase()
  for (const dig of SPELL_DIGRAPHS) {
    if (lower.slice(i, i + dig.length) === dig) {
      return { start: i, unit: word.slice(i, i + dig.length) }
    }
    if (i > 0 && lower.slice(i - 1, i + 1) === dig) {
      return { start: i - 1, unit: word.slice(i - 1, i + 1) }
    }
  }
  return { start: i, unit: word[i]! }
}

function blankAt(word: string, index: number): string {
  const { start, unit } = hardUnitAt(word, index)
  return `${word.slice(0, start)}_${word.slice(start + unit.length)}`
}

function rivalLetters(w: SpellWord, correct: string): string[] {
  const c = correct.toLowerCase()
  switch (w.rule) {
    case 'r-rr':
      return ['r', 'rr'].filter((x) => x !== c)
    case 'hie-hue':
    case 'haber-hablar':
      return ['h', ''].filter((x) => x !== c)
    case 'aba':
    case 'b-v':
      return ['b', 'v'].filter((x) => x !== c)
    case 'll-illa':
      return ['ll', 'y', 'l'].filter((x) => x !== c)
    case 'mb-mp':
      return ['m', 'n'].filter((x) => x !== c)
    default:
      return ['b', 'v', 'h', 'r'].filter((x) => x !== c)
  }
}

/** Presenta dígrafo como una sola ficha (LL / RR), no dos letras sueltas. */
function presentUnit(unit: string): string {
  const lower = unit.toLowerCase()
  if (lower === 'll' || lower === 'rr') return lower.toUpperCase()
  return unit
}

function buildMissing(seed: number, used: Set<string>, mode: SpellPlayMode): SpellMcqQuestion {
  const rand = mulberry32(seed)
  const w = pickWord(rand, used)
  used.add(w.word)
  const letter = presentUnit(hardUnitAt(w.word, w.hardIndex).unit)
  const rivals = rivalLetters(w, letter).map(presentUnit)
  const optionsSet = new Set<string>([letter, ...rivals])
  const pool = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'l', 'LL', 'm', 'n', 'r', 'RR', 's', 't', 'v']
  let guard = 0
  while (optionsSet.size < 4 && guard < 20) {
    guard += 1
    const ch = pool[Math.floor(rand() * pool.length)]!
    if (ch.toLowerCase() !== letter.toLowerCase()) optionsSet.add(ch)
  }
  const options = shuffle([...optionsSet].filter(Boolean).slice(0, 4), rand)
  if (!options.includes(letter)) options[0] = letter
  while (options.length < 4) {
    const filler = pool.find((p) => !options.some((o) => o.toLowerCase() === p.toLowerCase()))
    options.push(filler ?? `·${options.length}`)
  }
  return {
    kind: 'mcq',
    id: `miss-${w.word}-${seed}`,
    mode,
    prompt: '¿Qué falta? Piensa la regla',
    tip: w.tip,
    rule: w.rule,
    display: blankAt(w.word, w.hardIndex),
    options: options.slice(0, 4),
    correctIndex: options.indexOf(letter),
  }
}

function buildCorrect(seed: number, used: Set<string>, mode: SpellPlayMode): SpellMcqQuestion {
  const rand = mulberry32(seed)
  const w = pickWord(rand, used)
  used.add(w.word)
  const options = wordOptions(w, rand)
  return {
    kind: 'mcq',
    id: `ok-${w.word}-${seed}`,
    mode,
    prompt: '¿Cuál está bien escrita?',
    tip: w.tip,
    rule: w.rule,
    options,
    correctIndex: options.indexOf(w.word),
  }
}

function buildPicture(seed: number, used: Set<string>, mode: SpellPlayMode): SpellMcqQuestion {
  const rand = mulberry32(seed)
  const w = pickWord(rand, used)
  used.add(w.word)
  const options = wordOptions(w, rand)
  return {
    kind: 'mcq',
    id: `pic-${w.word}-${seed}`,
    mode,
    prompt: '¿Cómo se escribe?',
    tip: w.tip,
    rule: w.rule,
    emoji: w.emoji,
    options,
    correctIndex: options.indexOf(w.word),
  }
}

/**
 * Intrusa: 3 palabras bien + 1 falta sutil (pero/arrededor…).
 * Sin tip que delate la familia de la intrusa.
 */
function buildIntruder(seed: number, used: Set<string>, mode: SpellPlayMode): SpellMcqQuestion {
  const rand = mulberry32(seed)
  const target = pickWord(rand, used)
  used.add(target.word)
  const intruder =
    target.distractors.find(
      (d) => d.toLowerCase() !== target.word.toLowerCase() && !BANK_WORDS.has(d.toLowerCase()),
    ) ?? target.word.replace(/rr/i, 'r')

  const goods = new Set<string>([target.word])
  let guard = 0
  while (goods.size < 3 && guard < 60) {
    guard += 1
    const alt = SPELL_BANK[Math.floor(rand() * SPELL_BANK.length)]!.word
    if (alt.toLowerCase() !== intruder.toLowerCase()) goods.add(alt)
  }
  const options = shuffle([...goods, intruder].slice(0, 4), rand)
  if (!options.includes(intruder)) options[0] = intruder

  return {
    kind: 'mcq',
    id: `in-${target.word}-${seed}`,
    mode,
    prompt: '¿Cuál está mal escrita?',
    tip: 'Busca la falta: r/rr, h muda, b/v…',
    rule: target.rule,
    options,
    correctIndex: options.indexOf(intruder),
  }
}

/** Completa la frase: el ejercicio de verdad de 3.º. */
function buildComplete(seed: number, used: Set<string>, mode: SpellPlayMode): SpellMcqQuestion {
  const rand = mulberry32(seed)
  const ctx = pickContext(rand, used)
  used.add(ctx.id)
  const options = shuffle([...ctx.options], rand)
  const correct = ctx.options[ctx.correctIndex]!
  return {
    kind: 'mcq',
    id: `ctx-${ctx.id}-${seed}`,
    mode,
    prompt: 'Elige la forma que encaja en la frase',
    tip: ctx.tip,
    rule: ctx.rule,
    display: ctx.sentence,
    options,
    correctIndex: options.indexOf(correct),
  }
}

const MIXERS: Array<
  (seed: number, used: Set<string>, mode: SpellPlayMode) => SpellQuestion
> = [buildComplete, buildComplete, buildCorrect, buildIntruder, buildMissing, buildPicture]

export function buildSpellQuestion(
  mode: SpellPlayMode,
  seed: number,
  used = new Set<string>(),
): SpellQuestion {
  switch (mode) {
    case 'missing':
      return buildMissing(seed, used, mode)
    case 'correct':
      return buildCorrect(seed, used, mode)
    case 'picture':
      return buildPicture(seed, used, mode)
    case 'intruder':
      return buildIntruder(seed, used, mode)
    case 'complete':
      return buildComplete(seed, used, mode)
    case 'mix': {
      const rand = mulberry32(seed)
      const fn = MIXERS[Math.floor(rand() * MIXERS.length)]!
      return fn(seed, used, 'mix')
    }
  }
}

export function buildSpellRound(mode: SpellPlayMode, count = SPELL_ROUND_SIZE, seed = Date.now()) {
  const used = new Set<string>()
  const out: SpellQuestion[] = []
  for (let i = 0; i < count; i += 1) {
    out.push(buildSpellQuestion(mode, seed + i * 9173, used))
  }
  return out
}
