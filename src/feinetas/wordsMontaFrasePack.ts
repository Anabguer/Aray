/**
 * Pack Monta la frase (ordenar tokens).
 */

export const WORDS_MONTA_FRASE_SCHEMA_VERSION = 1 as const

export type WordsMontaFraseItem = {
  id: string
  tokens: string[]
  source?: string
  tip?: string
  status?: 'active' | 'deprecated'
}

export type WordsMontaFrasePack = {
  schemaVersion: number
  pack: {
    id: string
    title: string
    ownerBank: string
    packKind: 'order-sentence'
    level: string
    locale: string
    revisionStatus: 'draft' | 'approved' | 'frozen'
    contentVersion: number
    notes?: string
  }
  items: WordsMontaFraseItem[]
}

export type WordsPackIssue = { path: string; message: string }

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function validateWordsMontaFrasePack(raw: unknown): WordsPackIssue[] {
  const issues: WordsPackIssue[] = []
  if (!raw || typeof raw !== 'object') {
    return [{ path: '', message: 'El pack debe ser un objeto' }]
  }
  const root = raw as Record<string, unknown>
  if (root.schemaVersion !== WORDS_MONTA_FRASE_SCHEMA_VERSION) {
    issues.push({
      path: 'schemaVersion',
      message: `Se esperaba schemaVersion ${WORDS_MONTA_FRASE_SCHEMA_VERSION}`,
    })
  }
  if (!root.pack || typeof root.pack !== 'object') {
    issues.push({ path: 'pack', message: 'Falta pack' })
    return issues
  }
  const pack = root.pack as Record<string, unknown>
  if (pack.packKind !== 'order-sentence') {
    issues.push({ path: 'pack.packKind', message: 'Debe ser order-sentence' })
  }
  if (!Array.isArray(root.items) || root.items.length < 6) {
    issues.push({ path: 'items', message: 'Hacen falta al menos 6 frases' })
    return issues
  }
  const ids = new Set<string>()
  root.items.forEach((item, index) => {
    const base = `items[${index}]`
    if (!item || typeof item !== 'object') {
      issues.push({ path: base, message: 'Ítem inválido' })
      return
    }
    const row = item as Record<string, unknown>
    if (!isNonEmptyString(row.id)) {
      issues.push({ path: `${base}.id`, message: 'id obligatorio' })
    } else if (ids.has(row.id)) {
      issues.push({ path: `${base}.id`, message: `id duplicado: ${row.id}` })
    } else {
      ids.add(row.id)
    }
    if (!Array.isArray(row.tokens) || row.tokens.length < 3) {
      issues.push({ path: `${base}.tokens`, message: 'Al menos 3 tokens' })
      return
    }
    row.tokens.forEach((t, ti) => {
      if (!isNonEmptyString(t)) {
        issues.push({ path: `${base}.tokens[${ti}]`, message: 'token vacío' })
      }
    })
  })
  return issues
}

export function assertValidWordsMontaFrasePack(
  raw: unknown,
): asserts raw is WordsMontaFrasePack {
  const issues = validateWordsMontaFrasePack(raw)
  if (issues.length > 0) {
    throw new Error(
      `[palabras/monta-frase] pack inválido:\n` +
        issues.map((i) => `- ${i.path}: ${i.message}`).join('\n'),
    )
  }
}
