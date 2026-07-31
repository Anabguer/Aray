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

const BANK_WORDS = new Set(SPELL_BANK.map((w) => w.word))

function pickWord(rand: () => number, used: Set<string>): SpellWord {
  const pool = SPELL_BANK.filter((w) => !used.has(w.word))
  const list = pool.length > 0 ? pool : SPELL_BANK
  return list[Math.floor(rand() * list.length)]!
}

/** Opciones = palabra bien + sus 3 faltas (nunca otra palabra del banco). */
function wordOptions(w: SpellWord, rand: () => number): string[] {
  const wrongs = w.distractors.filter((d) => d !== w.word && !BANK_WORDS.has(d))
  const set = new Set<string>([w.word, ...wrongs])
  let n = 0
  while (set.size < 4 && n < 8) {
    n += 1
    const extra = `${w.word}${n === 1 ? 'h' : 's'}`
    if (extra !== w.word && !BANK_WORDS.has(extra)) set.add(extra)
  }
  const opts = shuffle([...set].slice(0, 4), rand)
  if (!opts.includes(w.word)) opts[0] = w.word
  return opts
}

function blankAt(word: string, index: number): string {
  const i = Math.max(0, Math.min(word.length - 1, index))
  return `${word.slice(0, i)}_${word.slice(i + 1)}`
}

/** Letras confusas según la regla (no abecedario al azar). */
function rivalLetters(w: SpellWord, correct: string): string[] {
  const map: Record<string, string[]> = {
    'b-v': ['b', 'v'],
    'g-j': ['g', 'j'],
    h: ['h', ''],
    'll-y': ['ll', 'y'],
    'r-rr': ['r', 'rr'],
    'mb-mp': ['m', 'n'],
    'que-qui': ['q', 'k', 'c'],
    'gue-gui': ['g', 'gü', 'gu'],
    'c-z': ['c', 'z', 's'],
    tilde: [correct],
  }
  const rivals = (map[w.rule] ?? ['b', 'v', 'g', 'j']).filter((x) => x && x !== correct)
  return rivals
}

function buildMissing(seed: number, used: Set<string>, mode: SpellPlayMode): SpellMcqQuestion {
  const rand = mulberry32(seed)
  const w = pickWord(rand, used)
  used.add(w.word)
  const idx = w.hardIndex
  const letter = w.word[idx]!
  // Si la zona difícil es digrafo (ll, rr), blank de 1 letra visible + opciones de letra
  const optionsSet = new Set<string>([letter, ...rivalLetters(w, letter)])
  const pool = 'bcdfghjklmnpqrstvwxyz'
  let guard = 0
  while (optionsSet.size < 4 && guard < 20) {
    guard += 1
    const ch = pool[Math.floor(rand() * pool.length)]!
    if (ch !== letter) optionsSet.add(ch)
  }
  const options = shuffle([...optionsSet].slice(0, 4), rand)
  if (!options.includes(letter)) options[0] = letter
  return {
    kind: 'mcq',
    id: `miss-${w.word}-${seed}`,
    mode,
    prompt: '¿Qué letra falta? (repasa la regla)',
    tip: w.tip,
    display: blankAt(w.word, idx),
    options,
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
    target.distractors.find((d) => d !== target.word && !BANK_WORDS.has(d)) ?? `${target.word}x`

  const goods = new Set<string>([target.word])
  let guard = 0
  while (goods.size < 3 && guard < 50) {
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
    tip: target.tip,
    options,
    correctIndex: options.indexOf(intruder),
  }
}

function buildComplete(seed: number, used: Set<string>, mode: SpellPlayMode): SpellMcqQuestion {
  const rand = mulberry32(seed)
  const w = pickWord(rand, used)
  used.add(w.word)
  const options = wordOptions(w, rand)
  return {
    kind: 'mcq',
    id: `cmp-${w.word}-${seed}`,
    mode,
    prompt: 'Completa eligiendo la forma correcta',
    tip: w.tip,
    display: blankAt(w.word, w.hardIndex),
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
