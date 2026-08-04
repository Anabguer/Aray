/**
 * Tipos del pack de lemas de inglés (INGLES_JSON_SPEC.md schemaVersion 1).
 * Independiente de Ortografía: sin errors[] / ruleId / ruleText.
 */

export const ENGLISH_SCHEMA_VERSION = 1 as const

export type EnglishFrequency =
  | 'muy_frecuente'
  | 'frecuente'
  | 'poco_frecuente'

export type EnglishRevisionStatus = 'draft' | 'approved' | 'frozen'

export type EnglishImage = {
  recommended: boolean
  /** null mientras no haya assets. */
  ref: string | null
}

export type EnglishLemma = {
  id: string
  lemma: string
  glossEs: string
  category: string
  frequency: EnglishFrequency
  image: EnglishImage
  notes?: string
  tags?: string[]
  status?: 'active' | 'deprecated'
}

export type EnglishPackMeta = {
  id: string
  title: string
  ownerBank: string
  topicFamily: string
  level: string
  locale: string
  revisionStatus: EnglishRevisionStatus
  contentVersion: number
  sourceEditorialPhase?: string
  notes?: string
}

export type EnglishLemmaPack = {
  schemaVersion: number
  pack: EnglishPackMeta
  lemmas: EnglishLemma[]
}

const FREQUENCIES = new Set<EnglishFrequency>([
  'muy_frecuente',
  'frecuente',
  'poco_frecuente',
])

/** Categorías cerradas por pack (INGLES_JSON_SPEC §5 + tanda 1). */
export const ENGLISH_CATEGORIES_BY_PACK: Record<string, ReadonlySet<string>> = {
  'ingles-colours-numbers': new Set(['Colours', 'Numbers']),
  'ingles-school': new Set(['Places', 'People', 'Objects']),
  'ingles-family': new Set([
    'Family group',
    'Core family',
    'Extended family',
  ]),
  'ingles-food': new Set(['Food', 'Drinks']),
  'ingles-numbers': new Set(['Ones and teens', 'Tens']),
  'ingles-there-is': new Set(['Present', 'Past', 'Question', 'Short answers']),
  'ingles-prepositions': new Set(['Place', 'Where']),
  'ingles-abilities': new Set(['Play', 'Move', 'Go']),
  'ingles-routines': new Set(['Morning', 'Day', 'Evening']),
  'ingles-places': new Set(['Camp', 'Landscape', 'Settlement']),
  'ingles-weather': new Set(['Weather', 'Season']),
  'ingles-characters': new Set(['People', 'Clothes', 'Adjectives']),
  'ingles-possessives': new Set(['Possessive s', 'Adj', 'Things']),
  'ingles-transport': new Set(['Vehicle', 'Manner', 'Phrase']),
  'ingles-money': new Set(['Currency', 'Things', 'Phrase']),
  'ingles-present-simple': new Set(['Verbs', 'Aux', 'Time']),
  'ingles-present-continuous': new Set(['Actions', 'Question', 'Short']),
  'ingles-phrases': new Set(['Can', 'Have got', 'Be', 'Like', 'Link']),
  'ingles-time': new Set(['Clock', 'Question', 'Short', 'Phrase', 'Part']),
}

export type EnglishPackValidationIssue = {
  path: string
  message: string
}

export function validateEnglishLemmaPack(
  data: unknown,
): EnglishPackValidationIssue[] {
  const issues: EnglishPackValidationIssue[] = []
  if (!data || typeof data !== 'object') {
    return [{ path: '', message: 'El pack debe ser un objeto' }]
  }
  const root = data as Record<string, unknown>

  if (root.schemaVersion !== ENGLISH_SCHEMA_VERSION) {
    issues.push({
      path: 'schemaVersion',
      message: `Se esperaba schemaVersion ${ENGLISH_SCHEMA_VERSION}`,
    })
  }

  const pack = root.pack
  let packId = ''
  if (!pack || typeof pack !== 'object') {
    issues.push({ path: 'pack', message: 'Falta pack' })
  } else {
    const p = pack as Record<string, unknown>
    for (const key of [
      'id',
      'title',
      'ownerBank',
      'topicFamily',
      'level',
      'locale',
      'revisionStatus',
      'contentVersion',
    ]) {
      if (p[key] == null || p[key] === '') {
        issues.push({ path: `pack.${key}`, message: 'Campo obligatorio' })
      }
    }
    packId = typeof p.id === 'string' ? p.id : ''
    if (p.locale !== 'en-GB') {
      issues.push({ path: 'pack.locale', message: 'Debe ser en-GB' })
    }
    if (
      p.revisionStatus !== 'draft' &&
      p.revisionStatus !== 'approved' &&
      p.revisionStatus !== 'frozen'
    ) {
      issues.push({
        path: 'pack.revisionStatus',
        message: 'draft | approved | frozen',
      })
    }
    if (typeof p.contentVersion !== 'number') {
      issues.push({
        path: 'pack.contentVersion',
        message: 'Debe ser number',
      })
    }
  }

  const lemmas = root.lemmas
  if (!Array.isArray(lemmas) || lemmas.length === 0) {
    issues.push({ path: 'lemmas', message: 'Debe haber al menos un lema' })
    return issues
  }

  const allowedCats = ENGLISH_CATEGORIES_BY_PACK[packId]
  const seenIds = new Set<string>()
  lemmas.forEach((raw, index) => {
    const base = `lemmas[${index}]`
    if (!raw || typeof raw !== 'object') {
      issues.push({ path: base, message: 'Lema inválido' })
      return
    }
    const L = raw as Record<string, unknown>
    for (const key of [
      'id',
      'lemma',
      'glossEs',
      'category',
      'frequency',
      'image',
    ]) {
      if (L[key] == null || L[key] === '') {
        issues.push({ path: `${base}.${key}`, message: 'Campo obligatorio' })
      }
    }
    const id = typeof L.id === 'string' ? L.id : ''
    if (id) {
      if (seenIds.has(id)) {
        issues.push({ path: `${base}.id`, message: `Id duplicado: ${id}` })
      }
      seenIds.add(id)
    }
    if (typeof L.frequency === 'string' && !FREQUENCIES.has(L.frequency as EnglishFrequency)) {
      issues.push({
        path: `${base}.frequency`,
        message: 'muy_frecuente | frecuente | poco_frecuente',
      })
    }
    if (
      allowedCats &&
      typeof L.category === 'string' &&
      !allowedCats.has(L.category)
    ) {
      issues.push({
        path: `${base}.category`,
        message: `Categoría no permitida en ${packId}: ${L.category}`,
      })
    }
    const image = L.image
    if (!image || typeof image !== 'object') {
      issues.push({ path: `${base}.image`, message: 'Falta image' })
    } else {
      const img = image as Record<string, unknown>
      if (typeof img.recommended !== 'boolean') {
        issues.push({
          path: `${base}.image.recommended`,
          message: 'Debe ser boolean',
        })
      }
      if (!('ref' in img)) {
        issues.push({ path: `${base}.image.ref`, message: 'Falta ref (puede ser null)' })
      } else if (img.ref != null && typeof img.ref !== 'string') {
        issues.push({
          path: `${base}.image.ref`,
          message: 'string | null',
        })
      }
    }
  })

  return issues
}

export function assertValidEnglishLemmaPack(data: unknown): asserts data is EnglishLemmaPack {
  const issues = validateEnglishLemmaPack(data)
  if (issues.length > 0) {
    const msg = issues.map((i) => `${i.path}: ${i.message}`).join('; ')
    throw new Error(`[ingles] Pack inválido: ${msg}`)
  }
}
