/**
 * Pack Varios: pares pronoun-verb / common-proper.
 */

export const WORDS_VARIOS_PARES_SCHEMA_VERSION = 1 as const

export type WordsVariosKind = 'pronoun-verb' | 'common-proper'

export type WordsVariosParItem = {
  id: string
  kind: WordsVariosKind
  left: string
  right: string
  tip?: string
  status?: 'active' | 'deprecated'
}

export type WordsVariosParesPack = {
  schemaVersion: number
  pack: {
    id: string
    title: string
    ownerBank: string
    packKind: 'varios-pares'
    level: string
    locale: string
    revisionStatus: 'draft' | 'approved' | 'frozen'
    contentVersion: number
    notes?: string
  }
  items: WordsVariosParItem[]
}

export type WordsPackIssue = { path: string; message: string }

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function validateWordsVariosParesPack(raw: unknown): WordsPackIssue[] {
  const issues: WordsPackIssue[] = []
  if (!raw || typeof raw !== 'object') {
    return [{ path: '', message: 'El pack debe ser un objeto' }]
  }
  const root = raw as Record<string, unknown>
  if (root.schemaVersion !== WORDS_VARIOS_PARES_SCHEMA_VERSION) {
    issues.push({
      path: 'schemaVersion',
      message: `Se esperaba schemaVersion ${WORDS_VARIOS_PARES_SCHEMA_VERSION}`,
    })
  }
  if (!root.pack || typeof root.pack !== 'object') {
    issues.push({ path: 'pack', message: 'Falta pack' })
    return issues
  }
  const pack = root.pack as Record<string, unknown>
  if (pack.packKind !== 'varios-pares') {
    issues.push({ path: 'pack.packKind', message: 'Debe ser varios-pares' })
  }
  if (!Array.isArray(root.items) || root.items.length < 8) {
    issues.push({ path: 'items', message: 'Hacen falta al menos 8 ítems' })
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
    if (row.kind !== 'pronoun-verb' && row.kind !== 'common-proper') {
      issues.push({ path: `${base}.kind`, message: 'pronoun-verb | common-proper' })
    }
    if (!isNonEmptyString(row.left)) {
      issues.push({ path: `${base}.left`, message: 'left obligatorio' })
    }
    if (!isNonEmptyString(row.right)) {
      issues.push({ path: `${base}.right`, message: 'right obligatorio' })
    }
  })
  return issues
}

export function assertValidWordsVariosParesPack(
  raw: unknown,
): asserts raw is WordsVariosParesPack {
  const issues = validateWordsVariosParesPack(raw)
  if (issues.length > 0) {
    throw new Error(
      `[palabras/varios-pares] pack inválido:\n` +
        issues.map((i) => `- ${i.path}: ${i.message}`).join('\n'),
    )
  }
}
