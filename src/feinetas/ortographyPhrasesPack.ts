/**
 * Pack de frases MCQ para Completa la frase (Fase 4).
 * Distractores fijos en JSON; sin frases embebidas en TypeScript.
 */
export const ORTOGRAPHY_PHRASES_SCHEMA_VERSION = 1 as const

export type OrtographyPhraseItem = {
  id: string
  sentence: string
  options: string[]
  correctIndex: number
  ruleId: string
  itemType: 'homophones' | 'spelling-in-context'
  difficulty: number
  explanation?: string
  sourceNotes?: string
  status?: 'approved' | 'deprecated'
}

export type OrtographyPhrasesPack = {
  schemaVersion: number
  pack: {
    id: string
    title: string
    ownerBank: string
    ruleFamily: string
    level: string
    locale: string
    revisionStatus: 'draft' | 'approved' | 'frozen'
    contentVersion: number
    sourceEditorialPhase?: string
    notes?: string
  }
  items: OrtographyPhraseItem[]
}

export type OrtographyPhrasesValidationIssue = { path: string; message: string }

export function validateOrtographyPhrasesPack(
  data: unknown,
): OrtographyPhrasesValidationIssue[] {
  const issues: OrtographyPhrasesValidationIssue[] = []
  if (!data || typeof data !== 'object') {
    return [{ path: '', message: 'Pack no es un objeto' }]
  }
  const root = data as Record<string, unknown>
  if (root.schemaVersion !== ORTOGRAPHY_PHRASES_SCHEMA_VERSION) {
    issues.push({ path: 'schemaVersion', message: 'Debe ser 1' })
  }
  if (!root.pack || typeof root.pack !== 'object') {
    issues.push({ path: 'pack', message: 'Falta pack' })
    return issues
  }
  const pack = root.pack as Record<string, unknown>
  if (pack.id !== 'ortografia-frases-completar') {
    issues.push({ path: 'pack.id', message: 'id esperado ortografia-frases-completar' })
  }
  if (pack.revisionStatus !== 'approved' && pack.revisionStatus !== 'frozen') {
    issues.push({ path: 'pack.revisionStatus', message: 'Debe ser approved o frozen' })
  }
  if (!Array.isArray(root.items)) {
    issues.push({ path: 'items', message: 'items debe ser array' })
    return issues
  }
  const ids = new Set<string>()
  root.items.forEach((raw, i) => {
    const base = `items[${i}]`
    if (!raw || typeof raw !== 'object') {
      issues.push({ path: base, message: 'ítem inválido' })
      return
    }
    const item = raw as Record<string, unknown>
    if (typeof item.id !== 'string' || !item.id.startsWith('frase-')) {
      issues.push({ path: `${base}.id`, message: 'id debe empezar por frase-' })
    } else if (ids.has(item.id)) {
      issues.push({ path: `${base}.id`, message: `id duplicado ${item.id}` })
    } else {
      ids.add(item.id)
    }
    if (typeof item.sentence !== 'string' || !item.sentence.includes('___')) {
      issues.push({ path: `${base}.sentence`, message: 'Debe contener ___' })
    }
    if (!Array.isArray(item.options) || item.options.length !== 4) {
      issues.push({ path: `${base}.options`, message: 'Exactamente 4 opciones' })
    } else {
      const lower = item.options.map((o) => String(o).toLocaleLowerCase('es'))
      if (new Set(lower).size !== 4) {
        issues.push({ path: `${base}.options`, message: 'Opciones duplicadas' })
      }
      // no ay + ¡ay! pair
      const hasAy = lower.some((o) => o === 'ay')
      const hasBangAy = item.options.some((o) => /¡\s*ay\s*!/i.test(String(o)))
      if (hasAy && hasBangAy) {
        issues.push({ path: `${base}.options`, message: 'No mezclar ay y ¡ay!' })
      }
    }
    if (
      typeof item.correctIndex !== 'number' ||
      item.correctIndex < 0 ||
      item.correctIndex > 3
    ) {
      issues.push({ path: `${base}.correctIndex`, message: 'correctIndex 0–3' })
    } else if (Array.isArray(item.options)) {
      const correct = item.options[item.correctIndex]
      if (typeof item.sentence === 'string' && correct == null) {
        issues.push({ path: `${base}.correctIndex`, message: 'Índice fuera de opciones' })
      }
    }
    if (typeof item.ruleId !== 'string' || !item.ruleId) {
      issues.push({ path: `${base}.ruleId`, message: 'ruleId obligatorio' })
    }
  })
  return issues
}

export function assertValidOrtographyPhrasesPack(
  data: unknown,
): asserts data is OrtographyPhrasesPack {
  const issues = validateOrtographyPhrasesPack(data)
  if (issues.length > 0) {
    throw new Error(
      `[frases-completar] Pack inválido:\n` +
        issues.map((i) => `- ${i.path}: ${i.message}`).join('\n'),
    )
  }
}
