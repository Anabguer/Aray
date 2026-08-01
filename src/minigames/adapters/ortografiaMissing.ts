/**
 * Adaptador JSON → «Letra de la regla» (hueco).
 * Posición: diff lemma vs errors[0]; rivales por familia de regla (tabla local).
 */
import { ortographyMissKey } from '@/feinetas/ortographyCorpus'
import type { OrtographyCorpusEntry } from '@/feinetas/ortographyCorpus'
import {
  baseMcqFields,
  mulberry32,
  pickCorpusEntry,
  shuffle,
} from '@/minigames/adapters/ortografiaShared'
import { SPELL_ROUND_SIZE, type SpellMcqQuestion, type SpellPlayMode } from '@/spelling/types'

const RIVALS: Record<string, string[]> = {
  'r-rr': ['r', 'rr', 'R', 'RR'],
  h: ['h', ''],
  'hie-hue': ['h', ''],
  'hay-ahi-ay': ['h', ''],
  'hacer-echar': ['h', ''],
  'haber-hablar': ['h', ''],
  'b-v': ['b', 'v', 'B', 'V'],
  'g-j': ['g', 'j', 'G', 'J'],
  'll-y': ['ll', 'y', 'LL', 'Y'],
  'll-illa': ['ll', 'y', 'LL'],
  'c-z-qu': ['c', 'z', 'qu', 'k'],
  'd-z': ['c', 'z', 's'],
  'mb-mp': ['m', 'n'],
  'mb-mp-nv': ['m', 'n', 'nv'],
  'gu-gue': ['gu', 'gü', 'g'],
  tilde: ['´', ''],
  aba: ['b', 'v'],
  'bu-bur': ['b', 'v'],
}

function graphemes(s: string): string[] {
  return [...s]
}

/** Encuentra índice y unidad que difiere entre correcta y error. */
export function diffHardUnit(
  correct: string,
  wrong: string,
): { index: number; unit: string } | null {
  const a = graphemes(correct)
  const b = graphemes(wrong)
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    const ca = a[i]!.toLocaleLowerCase('es')
    const cb = b[j]!.toLocaleLowerCase('es')

    if (
      i + 1 < a.length &&
      ca === 'r' &&
      a[i + 1]!.toLocaleLowerCase('es') === 'r' &&
      cb === 'r' &&
      (j + 1 >= b.length || b[j + 1]!.toLocaleLowerCase('es') !== 'r')
    ) {
      const restA = a
        .slice(i + 2)
        .join('')
        .toLocaleLowerCase('es')
      const restB = b
        .slice(j + 1)
        .join('')
        .toLocaleLowerCase('es')
      if (restA === restB) return { index: i, unit: 'rr' }
    }

    if (
      i + 1 < a.length &&
      ca === 'l' &&
      a[i + 1]!.toLocaleLowerCase('es') === 'l' &&
      cb !== 'l'
    ) {
      return { index: i, unit: 'll' }
    }

    if (ca !== cb) {
      return { index: i, unit: a[i]! }
    }
    i += 1
    j += 1
  }
  if (a.length > b.length) {
    const idx = b.length
    if (
      idx + 1 < a.length &&
      a[idx]!.toLocaleLowerCase('es') === 'r' &&
      a[idx + 1]!.toLocaleLowerCase('es') === 'r'
    ) {
      return { index: idx, unit: 'rr' }
    }
    return { index: idx, unit: a[idx]! }
  }
  return null
}

function hardUnitForRule(word: string, ruleId: string): { index: number; unit: string } {
  const lower = word.toLocaleLowerCase('es')
  switch (ruleId) {
    case 'r-rr': {
      const rr = lower.indexOf('rr')
      if (rr >= 0) return { index: rr, unit: 'rr' }
      const r = lower.indexOf('r')
      return { index: Math.max(0, r), unit: 'r' }
    }
    case 'll-y':
    case 'll-illa': {
      const ll = lower.indexOf('ll')
      if (ll >= 0) return { index: ll, unit: 'll' }
      const y = lower.indexOf('y')
      return { index: Math.max(0, y), unit: y >= 0 ? 'y' : graphemes(word)[0]! }
    }
    case 'mb-mp':
    case 'mb-mp-nv': {
      const i = lower.search(/m[bp]/)
      return { index: i >= 0 ? i : Math.max(0, lower.indexOf('m')), unit: 'm' }
    }
    case 'gu-gue': {
      const gu = lower.indexOf('gü')
      if (gu >= 0) return { index: gu, unit: 'gü' }
      const g = lower.indexOf('gu')
      return { index: Math.max(0, g), unit: 'gu' }
    }
    case 'tilde': {
      const nfd = word.normalize('NFD')
      const idx = nfd.search(/\u0301/)
      if (idx > 0) {
        const base = [...nfd.slice(0, idx)]
        return { index: Math.max(0, base.length - 1), unit: '´' }
      }
      return { index: Math.floor(word.length / 2), unit: '´' }
    }
    case 'h':
    case 'hie-hue':
    case 'haber-hablar':
    case 'hacer-echar':
    case 'hay-ahi-ay':
      return { index: 0, unit: lower.startsWith('h') ? 'h' : graphemes(word)[0]! }
    default: {
      const bv = lower.search(/[bvgjcz]/)
      const i = bv >= 0 ? bv : 0
      return { index: i, unit: graphemes(word)[i]! }
    }
  }
}

function blankAt(word: string, index: number, unitLen: number): string {
  const chars = graphemes(word)
  const end = Math.min(chars.length, index + unitLen)
  return chars.slice(0, index).join('') + '·' + chars.slice(end).join('')
}

function presentUnit(unit: string): string {
  const lower = unit.toLocaleLowerCase('es')
  if (lower === 'll' || lower === 'rr') return lower.toUpperCase()
  if (lower === 'gü' || lower === 'gu') return lower
  return unit
}

export function buildOrtografiaMissingQuestion(
  seed: number,
  usedRefs: Set<string>,
  mode: SpellPlayMode = 'missing',
  forced?: OrtographyCorpusEntry,
): SpellMcqQuestion {
  const random = mulberry32(seed)
  const entry = forced ?? pickCorpusEntry(random, usedRefs)
  usedRefs.add(ortographyMissKey(entry.packId, entry.lemma.id))

  const wrong = entry.lemma.errors[0] ?? ''
  const hard =
    (wrong ? diffHardUnit(entry.lemma.lemma, wrong) : null) ??
    hardUnitForRule(entry.lemma.lemma, entry.lemma.ruleId)

  const letter = presentUnit(hard.unit)
  const unitLen = graphemes(hard.unit).length
  const rivals = (RIVALS[entry.lemma.ruleId] ?? ['b', 'v', 'h', 'r'])
    .map(presentUnit)
    .filter((x) => x.toLocaleLowerCase('es') !== letter.toLocaleLowerCase('es'))

  const optionsSet = new Set<string>([letter, ...rivals])
  const filler = ['b', 'c', 'g', 'h', 'j', 'll', 'LL', 'm', 'n', 'r', 'RR', 'v', 'y', 'z', '´']
  let guard = 0
  while (optionsSet.size < 4 && guard < 30) {
    guard += 1
    const ch = presentUnit(filler[Math.floor(random() * filler.length)]!)
    if (ch.toLocaleLowerCase('es') !== letter.toLocaleLowerCase('es')) optionsSet.add(ch)
  }
  const options = shuffle([...optionsSet].filter((x) => x !== undefined).slice(0, 4), random)
  if (!options.includes(letter)) options[0] = letter
  while (options.length < 4) options.push(filler[options.length]!)

  return {
    ...baseMcqFields(entry, mode, seed, 'miss'),
    prompt: '¿Qué falta? Piensa la regla',
    display: blankAt(entry.lemma.lemma, hard.index, unitLen),
    options: options.slice(0, 4),
    correctIndex: options.indexOf(letter),
  }
}

export function buildOrtografiaMissingRound(
  count = SPELL_ROUND_SIZE,
  seed = Date.now(),
  mode: SpellPlayMode = 'missing',
): SpellMcqQuestion[] {
  const used = new Set<string>()
  const out: SpellMcqQuestion[] = []
  for (let i = 0; i < count; i += 1) {
    out.push(buildOrtografiaMissingQuestion(seed + i * 9173, used, mode))
  }
  return out
}
