/**
 * Adaptador JSON → «Letra de la regla» (hueco).
 * Posición: diff lemma vs errors[0]; opciones SOLO del conjunto rival de la regla.
 * Sin fillers genéricos. 2–N opciones según la regla (no se fuerza 4).
 */
import { ortographyMissKey, getOrtographyCorpus } from '@/feinetas/ortographyCorpus'
import type { OrtographyCorpusEntry } from '@/feinetas/ortographyCorpus'
import {
  baseMcqFields,
  itemApprovedErrors,
  mulberry32,
  pickCorpusEntry,
  shuffle,
} from '@/minigames/adapters/ortografiaShared'
import { SPELL_ROUND_SIZE, type SpellMcqQuestion, type SpellPlayMode } from '@/spelling/types'

/** Unidades rivales por ruleId (sin unidades de otras reglas). */
export const RULE_RIVAL_UNITS: Record<string, string[]> = {
  'r-rr': ['r', 'rr'],
  h: ['h', ''],
  'hie-hue': ['h', ''],
  'hay-ahi-ay': ['h', ''],
  'hacer-echar': ['h', ''],
  'haber-hablar': ['h', ''],
  'b-v': ['b', 'v'],
  'g-j': ['g', 'j'],
  'll-y': ['ll', 'y'],
  'll-illa': ['ll', 'y'],
  'c-z-qu': ['c', 'z', 'qu'],
  'd-z': ['c', 'z', 's'],
  'mb-mp': ['m', 'n'],
  'mb-mp-nv': ['m', 'n'],
  'gu-gue': ['gu', 'gü'],
  tilde: ['´', ''],
  aba: ['b', 'v'],
  'bu-bur': ['b', 'v'],
}

function graphemes(s: string): string[] {
  return [...s]
}

export function presentUnit(unit: string): string {
  const lower = unit.toLocaleLowerCase('es')
  if (lower === 'll' || lower === 'rr') return lower.toUpperCase()
  if (lower === 'gü' || lower === 'gu') return lower
  return unit
}

function unitKey(unit: string): string {
  return presentUnit(unit).toLocaleLowerCase('es')
}

/** Opciones de unidad únicas para una regla (incluye la correcta). */
export function rivalUnitsForRule(ruleId: string, correctUnit: string): string[] {
  const raw = RULE_RIVAL_UNITS[ruleId]
  if (!raw || raw.length === 0) {
    return [presentUnit(correctUnit)]
  }
  const seen = new Set<string>()
  const out: string[] = []
  const push = (u: string) => {
    const presented = presentUnit(u)
    const key = unitKey(presented)
    if (seen.has(key)) return
    seen.add(key)
    out.push(presented)
  }
  push(correctUnit)
  for (const r of raw) push(r)
  return out
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
      const restA = a
        .slice(i)
        .join('')
        .toLocaleLowerCase('es')
      const restB = b
        .slice(j)
        .join('')
        .toLocaleLowerCase('es')
      const restAAfter1 = a
        .slice(i + 1)
        .join('')
        .toLocaleLowerCase('es')
      const restBAfter1 = b
        .slice(j + 1)
        .join('')
        .toLocaleLowerCase('es')

      // Error con letra de más (p. ej. echar → hechar): hueco «nada».
      if (restA === restBAfter1) {
        return { index: i, unit: '' }
      }
      // Error con letra de menos (p. ej. hierro → ierro): unidad de la correcta.
      if (restAAfter1 === restB) {
        return { index: i, unit: a[i]! }
      }
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
  // Correcta más corta: el error insertó algo al final → hueco vacío al final.
  if (b.length > a.length) {
    return { index: a.length, unit: '' }
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
    case 'c-z-qu': {
      const qu = lower.indexOf('qu')
      if (qu >= 0) return { index: qu, unit: 'qu' }
      const cz = lower.search(/[cz]/)
      return { index: cz >= 0 ? cz : 0, unit: graphemes(word)[cz >= 0 ? cz : 0]! }
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
      // Sin hache: el hueco pregunta si hace falta (respuesta = nada).
      return { index: 0, unit: lower.startsWith('h') ? 'h' : '' }
    case 'g-j': {
      const i = lower.search(/[gj]/)
      return { index: i >= 0 ? i : 0, unit: graphemes(word)[i >= 0 ? i : 0]! }
    }
    case 'b-v':
    case 'aba':
    case 'bu-bur': {
      const i = lower.search(/[bv]/)
      return { index: i >= 0 ? i : 0, unit: graphemes(word)[i >= 0 ? i : 0]! }
    }
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
  return chars.slice(0, index).join('') + '_' + chars.slice(end).join('')
}

/** Error que añade letras (típico: meter una h donde no va). */
export function isInsertionError(lemma: string, wrong: string): boolean {
  return graphemes(wrong).length > graphemes(lemma).length
}

export function buildOrtografiaMissingQuestion(
  seed: number,
  usedRefs: Set<string>,
  mode: SpellPlayMode = 'missing',
  forced?: OrtographyCorpusEntry,
): SpellMcqQuestion {
  const random = mulberry32(seed)
  const pool = getOrtographyCorpus().entries.filter((e) => itemApprovedErrors(e).length >= 1)
  const insertionPool = pool.filter((e) => {
    const w = itemApprovedErrors(e)[0]
    return Boolean(w && isInsertionError(e.lemma.lemma, w))
  })
  // ~28% de partidas: decidir si «no falta nada» (p. ej. ?echar → Nada, no h).
  const preferInsertion = !forced && insertionPool.length > 0 && random() < 0.28
  const entry =
    forced ?? pickCorpusEntry(random, usedRefs, preferInsertion ? insertionPool : pool)
  usedRefs.add(ortographyMissKey(entry.packId, entry.lemma.id))

  const wrong = itemApprovedErrors(entry)[0] ?? ''
  const hard =
    (wrong ? diffHardUnit(entry.lemma.lemma, wrong) : null) ??
    hardUnitForRule(entry.lemma.lemma, entry.lemma.ruleId)

  const letter = presentUnit(hard.unit)
  const unitLen = hard.unit === '' ? 0 : Math.max(1, graphemes(hard.unit).length)
  const options = shuffle(rivalUnitsForRule(entry.lemma.ruleId, letter), random)

  if (options.length < 2) {
    throw new Error(
      `[ortografia-missing] Regla sin rivales suficientes: ${entry.lemma.ruleId} (${entry.lemma.id})`,
    )
  }

  const correctIndex = options.findIndex((o) => unitKey(o) === unitKey(letter))
  if (correctIndex < 0) {
    throw new Error(
      `[ortografia-missing] Unidad correcta ausente: ${letter === '' ? '(nada)' : letter}`,
    )
  }

  return {
    ...baseMcqFields(entry, mode, seed, 'miss'),
    prompt: '¿Qué falta? Piensa la regla',
    display: blankAt(entry.lemma.lemma, hard.index, unitLen),
    options,
    correctIndex,
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
