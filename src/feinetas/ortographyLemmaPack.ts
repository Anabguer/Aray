/**
 * Tipos del pack de lemas de ortografía (JSON_SPEC.md schemaVersion 1).
 * Independiente de las mecánicas de minijuego.
 */

export const ORTOGRAPHY_SCHEMA_VERSION = 1 as const

export type OrtographyFrequency =
  | 'muy_frecuente'
  | 'frecuente'
  | 'poco_frecuente'

export type OrtographyCategory =
  | 'animales'
  | 'casa'
  | 'colegio'
  | 'comida'
  | 'objetos'
  | 'naturaleza'
  | 'acciones'
  | 'ciudad'
  | 'cuerpo'
  | 'otros'

export type OrtographyRevisionStatus = 'draft' | 'approved' | 'frozen'

export type OrtographyImage = {
  recommended: boolean
  /** null mientras no haya assets. */
  ref: string | null
}

export type OrtographyLemma = {
  id: string
  lemma: string
  errors: string[]
  ruleId: string
  ruleText: string
  frequency: OrtographyFrequency
  category: OrtographyCategory
  image: OrtographyImage
  /** Opcional: nunca debe contener el lema ni revelar la respuesta. */
  tip?: string
  notes?: string
  tags?: string[]
  difficulty?: number
  secondaryRuleIds?: string[]
  status?: 'active' | 'deprecated'
  legacyWordKey?: string
}

export type OrtographyPackMeta = {
  id: string
  title: string
  ownerBank: string
  ruleFamily: string
  level: string
  locale: string
  revisionStatus: OrtographyRevisionStatus
  contentVersion: number
  sourceEditorialPhase?: string
  notes?: string
}

export type OrtographyLemmaPack = {
  schemaVersion: number
  pack: OrtographyPackMeta
  lemmas: OrtographyLemma[]
}

const FREQUENCIES = new Set<OrtographyFrequency>([
  'muy_frecuente',
  'frecuente',
  'poco_frecuente',
])

const CATEGORIES = new Set<OrtographyCategory>([
  'animales',
  'casa',
  'colegio',
  'comida',
  'objetos',
  'naturaleza',
  'acciones',
  'ciudad',
  'cuerpo',
  'otros',
])

export type OrtographyPackValidationIssue = {
  path: string
  message: string
}

/** Valida un pack contra JSON_SPEC schemaVersion 1. No conecta minijuegos. */
export function validateOrtographyLemmaPack(
  data: unknown,
): OrtographyPackValidationIssue[] {
  const issues: OrtographyPackValidationIssue[] = []
  if (!data || typeof data !== 'object') {
    return [{ path: '', message: 'El pack debe ser un objeto' }]
  }
  const root = data as Record<string, unknown>

  if (root.schemaVersion !== ORTOGRAPHY_SCHEMA_VERSION) {
    issues.push({
      path: 'schemaVersion',
      message: `Se esperaba schemaVersion ${ORTOGRAPHY_SCHEMA_VERSION}`,
    })
  }

  const pack = root.pack
  if (!pack || typeof pack !== 'object') {
    issues.push({ path: 'pack', message: 'Falta pack' })
  } else {
    const p = pack as Record<string, unknown>
    for (const key of [
      'id',
      'title',
      'ownerBank',
      'ruleFamily',
      'level',
      'locale',
      'revisionStatus',
      'contentVersion',
    ] as const) {
      if (p[key] === undefined || p[key] === null || p[key] === '') {
        issues.push({ path: `pack.${key}`, message: 'Campo obligatorio' })
      }
    }
    if (typeof p.contentVersion !== 'number') {
      issues.push({ path: 'pack.contentVersion', message: 'Debe ser number' })
    }
  }

  if (!Array.isArray(root.lemmas)) {
    issues.push({ path: 'lemmas', message: 'Debe ser un array' })
    return issues
  }

  const ids = new Set<string>()
  const lemmas = new Set<string>()

  root.lemmas.forEach((raw, index) => {
    const base = `lemmas[${index}]`
    if (!raw || typeof raw !== 'object') {
      issues.push({ path: base, message: 'Lema inválido' })
      return
    }
    const item = raw as Record<string, unknown>

    for (const key of [
      'id',
      'lemma',
      'ruleId',
      'ruleText',
      'frequency',
      'category',
    ] as const) {
      if (typeof item[key] !== 'string' || !(item[key] as string).trim()) {
        issues.push({ path: `${base}.${key}`, message: 'Campo obligatorio string' })
      }
    }

    if (!Array.isArray(item.errors) || item.errors.length === 0) {
      issues.push({ path: `${base}.errors`, message: 'errors debe tener ≥1 elemento' })
    } else if (!item.errors.every((e) => typeof e === 'string' && e.trim())) {
      issues.push({ path: `${base}.errors`, message: 'errors solo strings no vacíos' })
    }

    if (!FREQUENCIES.has(item.frequency as OrtographyFrequency)) {
      issues.push({ path: `${base}.frequency`, message: `Valor inválido: ${String(item.frequency)}` })
    }
    if (!CATEGORIES.has(item.category as OrtographyCategory)) {
      issues.push({ path: `${base}.category`, message: `Valor inválido: ${String(item.category)}` })
    }

    const image = item.image
    if (!image || typeof image !== 'object') {
      issues.push({ path: `${base}.image`, message: 'Falta image' })
    } else {
      const img = image as Record<string, unknown>
      if (typeof img.recommended !== 'boolean') {
        issues.push({ path: `${base}.image.recommended`, message: 'Debe ser boolean' })
      }
      if (img.ref !== null && typeof img.ref !== 'string') {
        issues.push({ path: `${base}.image.ref`, message: 'Debe ser string | null' })
      }
    }

    const id = String(item.id ?? '')
    const lemma = String(item.lemma ?? '')
    if (id) {
      if (ids.has(id)) issues.push({ path: `${base}.id`, message: `id duplicado: ${id}` })
      ids.add(id)
    }
    if (lemma) {
      const key = lemma.toLocaleLowerCase('es')
      if (lemmas.has(key)) {
        issues.push({ path: `${base}.lemma`, message: `lemma duplicado: ${lemma}` })
      }
      lemmas.add(key)
    }

    if (item.tip !== undefined) {
      if (typeof item.tip !== 'string' || !item.tip.trim()) {
        issues.push({ path: `${base}.tip`, message: 'tip vacío: omitir el campo' })
      } else {
        const tip = item.tip.toLocaleLowerCase('es')
        if (lemma && tip.includes(lemma.toLocaleLowerCase('es'))) {
          issues.push({
            path: `${base}.tip`,
            message: 'tip no puede contener el lema correcto',
          })
        }
      }
    }

    if (Array.isArray(item.errors) && lemma) {
      for (const err of item.errors) {
        if (typeof err === 'string' && err.toLocaleLowerCase('es') === lemma.toLocaleLowerCase('es')) {
          issues.push({
            path: `${base}.errors`,
            message: 'Un error no puede coincidir con el lema',
          })
        }
      }
    }

    if (item.tags !== undefined && !Array.isArray(item.tags)) {
      issues.push({ path: `${base}.tags`, message: 'tags debe ser array' })
    }
    if (item.secondaryRuleIds !== undefined && !Array.isArray(item.secondaryRuleIds)) {
      issues.push({
        path: `${base}.secondaryRuleIds`,
        message: 'secondaryRuleIds debe ser array',
      })
    }
  })

  return issues
}

export function assertValidOrtographyLemmaPack(data: unknown): asserts data is OrtographyLemmaPack {
  const issues = validateOrtographyLemmaPack(data)
  if (issues.length > 0) {
    throw new Error(
      `[ortografia] Pack inválido:\n` +
        issues.map((i) => `- ${i.path}: ${i.message}`).join('\n'),
    )
  }
}
