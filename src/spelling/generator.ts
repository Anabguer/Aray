import { SPELL_BANK as WORDS } from '@/spelling/bank'
import { isJunkSpelling, makeDistractors } from '@/spelling/distract'
import {
  SPELL_ROUND_SIZE,
  type SpellMcqQuestion,
  type SpellPlayMode,
  type SpellQuestion,
  type SpellWord,
} from '@/spelling/types'
import type { SpellMissEntry } from '@/spelling/missStore'

const BANK_WORDS = new Set(WORDS.map((w) => w.word.toLowerCase()))

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

function usedRules(used: Set<string>): Set<string> {
  const rules = new Set<string>()
  for (const w of WORDS) {
    if (used.has(w.word)) rules.add(w.rule)
  }
  return rules
}

function wordByKey(key: string): SpellWord | undefined {
  const k = key.toLowerCase()
  return WORDS.find((w) => w.word.toLowerCase() === k)
}

type PickOpts = {
  preferKeys?: string[]
  preferRules?: string[]
}

function pickWord(rand: () => number, used: Set<string>, opts?: PickOpts): SpellWord {
  const prefer =
    opts?.preferKeys
      ?.map((k) => wordByKey(k))
      .filter((w): w is SpellWord => w != null)
      .filter((w) => !used.has(w.word)) ?? []
  if (prefer.length > 0) {
    return prefer[Math.floor(rand() * prefer.length)]!
  }

  const unused = WORDS.filter((w) => !used.has(w.word))
  const seenRules = usedRules(used)
  let pool = unused.filter((w) => !seenRules.has(w.rule))
  if (opts?.preferRules?.length) {
    const byRule = unused.filter((w) => opts.preferRules!.includes(w.rule))
    if (byRule.length > 0) pool = byRule
  }
  if (pool.length === 0) pool = unused.length > 0 ? unused : WORDS
  return pool[Math.floor(rand() * pool.length)]!
}

function wordOptions(w: SpellWord, rand: () => number): string[] {
  const wrongs = w.distractors.filter(
    (d) =>
      d.toLowerCase() !== w.word.toLowerCase() &&
      !BANK_WORDS.has(d.toLowerCase()) &&
      !isJunkSpelling(d, w.word),
  )
  const set = new Set<string>([w.word, ...wrongs])
  const extras = [
    ...makeDistractors(w.word, w.rule),
    w.word.replace(/rr/i, 'r'),
    w.word.replace(/^h/i, ''),
    w.word.replace(/b/i, 'v'),
    w.word.replace(/v/i, 'b'),
    w.word.replace(/ll/i, 'y'),
    w.word.replace(/m([bp])/i, 'n$1'),
    w.word.normalize('NFD').replace(/\u0301/g, ''),
  ]
  for (const extra of extras) {
    if (set.size >= 4) break
    if (
      extra &&
      extra.toLowerCase() !== w.word.toLowerCase() &&
      !BANK_WORDS.has(extra.toLowerCase()) &&
      !isJunkSpelling(extra, w.word)
    ) {
      set.add(extra)
    }
  }
  // Sin relleno absurdo (ón/ito/ía / in+lema). Mejor 2–3 opciones reales que inventos.
  const opts = shuffle([...set].slice(0, 4), rand)
  if (!opts.includes(w.word)) opts[0] = w.word
  return opts.slice(0, Math.max(2, opts.length))
}

const SPELL_DIGRAPHS = ['ll', 'rr'] as const

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
    case 'bu-bur':
      return ['b', 'v'].filter((x) => x !== c)
    case 'll-illa':
      return ['ll', 'y', 'l'].filter((x) => x !== c)
    case 'mb-mp':
      return ['m', 'n'].filter((x) => x !== c)
    case 'g-j':
      return ['g', 'j'].filter((x) => x !== c)
    case 'd-z':
      return ['c', 'z', 's'].filter((x) => x !== c)
    case 'tilde':
      return ['´', ''].filter((x) => x !== c)
    default:
      return ['b', 'v', 'h', 'r'].filter((x) => x !== c)
  }
}

function presentUnit(unit: string): string {
  const lower = unit.toLowerCase()
  if (lower === 'll' || lower === 'rr') return lower.toUpperCase()
  return unit
}

function buildMissing(
  seed: number,
  used: Set<string>,
  mode: SpellPlayMode,
  pick?: PickOpts,
): SpellMcqQuestion {
  const rand = mulberry32(seed)
  const w = pickWord(rand, used, pick)
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
    targetKey: w.word,
  }
}

function buildCorrect(
  seed: number,
  used: Set<string>,
  mode: SpellPlayMode,
  pick?: PickOpts,
): SpellMcqQuestion {
  const rand = mulberry32(seed)
  const w = pickWord(rand, used, pick)
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
    targetKey: w.word,
  }
}

function buildPicture(
  seed: number,
  used: Set<string>,
  mode: SpellPlayMode,
  pick?: PickOpts,
): SpellMcqQuestion {
  const rand = mulberry32(seed)
  const w = pickWord(rand, used, pick)
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
    targetKey: w.word,
  }
}

function buildIntruder(
  seed: number,
  used: Set<string>,
  mode: SpellPlayMode,
  pick?: PickOpts,
): SpellMcqQuestion {
  const rand = mulberry32(seed)
  const target = pickWord(rand, used, pick)
  used.add(target.word)
  const intruder =
    target.distractors.find(
      (d) => d.toLowerCase() !== target.word.toLowerCase() && !BANK_WORDS.has(d.toLowerCase()),
    ) ?? target.word.replace(/rr/i, 'r')

  const goods = new Set<string>([target.word])
  let guard = 0
  while (goods.size < 3 && guard < 60) {
    guard += 1
    const alt = WORDS[Math.floor(rand() * WORDS.length)]!.word
    if (alt.toLowerCase() !== intruder.toLowerCase()) goods.add(alt)
  }
  const options = shuffle([...goods, intruder].slice(0, 4), rand)
  if (!options.includes(intruder)) options[0] = intruder

  return {
    kind: 'mcq',
    id: `in-${target.word}-${seed}`,
    mode,
    prompt: '¿Cuál está mal escrita?',
    tip: target.tip ?? 'Busca el error de la regla (b/v, r/rr, h…)',
    rule: target.rule,
    options,
    correctIndex: options.indexOf(intruder),
    targetKey: target.word,
  }
}

function buildComplete(
  _seed: number,
  _used: Set<string>,
  _mode: SpellPlayMode,
  _pick?: PickOpts,
): SpellMcqQuestion {
  throw new Error(
    '[generator] complete retirado: usar buildOrtografiaCompleteRound (pack frases-completar.json)',
  )
}

const MIXERS: Array<
  (seed: number, used: Set<string>, mode: SpellPlayMode, pick?: PickOpts) => SpellQuestion
> = [buildCorrect, buildIntruder, buildMissing, buildPicture, buildCorrect]

const REVIEW_MIXERS = [buildCorrect, buildMissing, buildPicture, buildIntruder]

export type BuildSpellRoundOptions = {
  preferMisses?: SpellMissEntry[]
}

export function buildSpellQuestion(
  mode: SpellPlayMode,
  seed: number,
  used = new Set<string>(),
  pick?: PickOpts,
): SpellQuestion {
  switch (mode) {
    case 'missing':
      return buildMissing(seed, used, mode, pick)
    case 'correct':
      return buildCorrect(seed, used, mode, pick)
    case 'picture':
      return buildPicture(seed, used, mode, pick)
    case 'intruder':
      return buildIntruder(seed, used, mode, pick)
    case 'complete':
      return buildComplete(seed, used, mode, pick)
    case 'mix': {
      const rand = mulberry32(seed)
      const fn = MIXERS[Math.floor(rand() * MIXERS.length)]!
      return fn(seed, used, 'mix', pick)
    }
    case 'review': {
      const rand = mulberry32(seed)
      const fn = REVIEW_MIXERS[Math.floor(rand() * REVIEW_MIXERS.length)]!
      return fn(seed, used, 'review', pick)
    }
  }
}

export function buildSpellRound(
  mode: SpellPlayMode,
  count = SPELL_ROUND_SIZE,
  seed = Date.now(),
  opts?: BuildSpellRoundOptions,
) {
  const used = new Set<string>()
  const out: SpellQuestion[] = []
  const misses = opts?.preferMisses ?? []
  const preferKeys = misses.map((m) => m.key)
  const preferRules = [
    ...new Set(misses.map((m) => m.rule).filter((r): r is NonNullable<typeof r> => Boolean(r))),
  ]

  for (let i = 0; i < count; i += 1) {
    const pick: PickOpts | undefined =
      mode === 'review' || preferKeys.length > 0
        ? {
            preferKeys: preferKeys.length > 0 ? preferKeys : undefined,
            preferRules: preferRules.length > 0 ? preferRules : undefined,
          }
        : undefined
    // En review: las primeras preguntas priorizan claves concretas; luego misma regla.
    const roundPick: PickOpts | undefined =
      mode === 'review'
        ? {
            preferKeys: i < preferKeys.length ? preferKeys : undefined,
            preferRules: preferRules.length > 0 ? preferRules : undefined,
          }
        : pick
    out.push(buildSpellQuestion(mode === 'review' ? 'review' : mode, seed + i * 9173, used, roundPick))
  }
  return out
}
