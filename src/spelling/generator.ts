import {
  SPELL_BANK,
  SPELL_ROUND_SIZE,
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

function pickWord(rand: () => number, used: Set<string>): SpellWord {
  const pool = SPELL_BANK.filter((w) => !used.has(w.word))
  const list = pool.length > 0 ? pool : SPELL_BANK
  return list[Math.floor(rand() * list.length)]!
}

function fakeMisspell(word: string, rand: () => number): string {
  const swaps = ['b', 'v', 'h', 'll', 'y', 'g', 'j', 'c', 'z', 's']
  let guard = 0
  while (guard < 12) {
    guard += 1
    const i = Math.floor(rand() * word.length)
    const ch = swaps[Math.floor(rand() * swaps.length)]!
    const candidate = `${word.slice(0, i)}${ch}${word.slice(i + 1)}`
    if (candidate !== word && !SPELL_BANK.some((w) => w.word === candidate)) return candidate
  }
  return `${word}x`
}

function uniqueOptions(correct: string, wrongs: string[], rand: () => number): string[] {
  const set = new Set<string>([correct])
  for (const w of wrongs) {
    if (w && w !== correct && !SPELL_BANK.some((b) => b.word === w)) set.add(w)
  }
  let guard = 0
  while (set.size < 4 && guard < 24) {
    guard += 1
    set.add(fakeMisspell(correct, rand))
  }
  const opts = shuffle([...set].slice(0, 4), rand)
  if (!opts.includes(correct)) opts[0] = correct
  return opts
}

function blankAt(word: string, index: number): string {
  const i = Math.max(0, Math.min(word.length - 1, index))
  return `${word.slice(0, i)}_${word.slice(i + 1)}`
}

function buildMissing(seed: number, used: Set<string>, mode: SpellPlayMode): SpellMcqQuestion {
  const rand = mulberry32(seed)
  const w = pickWord(rand, used)
  used.add(w.word)
  const idx = w.hardIndex ?? Math.floor(w.word.length / 2)
  const letter = w.word[idx]!
  const wrongLetters = Array.from(
    new Set(
      w.distractors
        .map((d) => d[idx])
        .filter((ch): ch is string => Boolean(ch) && ch !== letter),
    ),
  )
  while (wrongLetters.length < 3) {
    const pool = 'bcdfghjklmnpqrstvwxyz'
    const ch = pool[Math.floor(rand() * pool.length)]!
    if (ch !== letter && !wrongLetters.includes(ch)) wrongLetters.push(ch)
  }
  const options = uniqueOptions(letter, wrongLetters, rand)
  return {
    kind: 'mcq',
    id: `miss-${w.word}-${seed}`,
    mode,
    prompt: '¿Qué letra falta?',
    display: blankAt(w.word, idx),
    options,
    correctIndex: options.indexOf(letter),
  }
}

function buildCorrect(seed: number, used: Set<string>, mode: SpellPlayMode): SpellMcqQuestion {
  const rand = mulberry32(seed)
  const w = pickWord(rand, used)
  used.add(w.word)
  const options = uniqueOptions(w.word, w.distractors, rand)
  return {
    kind: 'mcq',
    id: `ok-${w.word}-${seed}`,
    mode,
    prompt: '¿Qué palabra está bien escrita?',
    options,
    correctIndex: options.indexOf(w.word),
  }
}

function buildPicture(seed: number, used: Set<string>, mode: SpellPlayMode): SpellMcqQuestion {
  const rand = mulberry32(seed)
  const w = pickWord(rand, used)
  used.add(w.word)
  const options = uniqueOptions(w.word, w.distractors, rand)
  return {
    kind: 'mcq',
    id: `pic-${w.word}-${seed}`,
    mode,
    prompt: '¿Cómo se escribe?',
    emoji: w.emoji,
    options,
    correctIndex: options.indexOf(w.word),
  }
}

function buildIntruder(seed: number, used: Set<string>, mode: SpellPlayMode): SpellMcqQuestion {
  const rand = mulberry32(seed)
  const target = pickWord(rand, used)
  used.add(target.word)
  const intruder =
    target.distractors.find((d) => d && d !== target.word && !SPELL_BANK.some((w) => w.word === d)) ??
    `${target.word}x`

  // 3 palabras bien escritas + 1 mal escrita (la intrusa)
  const goods = new Set<string>([target.word])
  let guard = 0
  while (goods.size < 3 && guard < 40) {
    guard += 1
    const alt = SPELL_BANK[Math.floor(rand() * SPELL_BANK.length)]!.word
    if (alt !== intruder) goods.add(alt)
  }
  const options = shuffle([...goods, intruder].slice(0, 4), rand)
  if (!options.includes(intruder)) options[0] = intruder

  return {
    kind: 'mcq',
    id: `in-${target.word}-${seed}`,
    mode,
    prompt: '¿Cuál está mal escrita? (la intrusa)',
    options,
    correctIndex: options.indexOf(intruder),
  }
}

function buildComplete(seed: number, used: Set<string>, mode: SpellPlayMode): SpellMcqQuestion {
  const rand = mulberry32(seed)
  const w = pickWord(rand, used)
  used.add(w.word)
  const idx = w.hardIndex ?? 1
  const options = uniqueOptions(w.word, w.distractors, rand)
  return {
    kind: 'mcq',
    id: `cmp-${w.word}-${seed}`,
    mode,
    prompt: 'Completa la palabra',
    display: blankAt(w.word, idx),
    options,
    correctIndex: options.indexOf(w.word),
  }
}

const MIXERS: Array<
  (seed: number, used: Set<string>, mode: SpellPlayMode) => SpellQuestion
> = [buildMissing, buildCorrect, buildPicture, buildIntruder, buildComplete]

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
