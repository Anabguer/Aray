/**
 * Pack Clasifica (género / número / artículo).
 */

export const WORDS_CLASIFICA_SCHEMA_VERSION = 1 as const

export type WordsClasificaGender = 'm' | 'f'
export type WordsClasificaNumber = 'sg' | 'pl'
export type WordsClasificaArticle = 'el' | 'la' | 'los' | 'las'

export type WordsClasificaItem = {
  id: string
  word: string
  gender: WordsClasificaGender
  number: WordsClasificaNumber
  article: WordsClasificaArticle
  tip?: string
  status?: 'active' | 'deprecated'
}

export type WordsClasificaPack = {
  schemaVersion: number
  pack: {
    id: string
    title: string
    ownerBank: string
    packKind: 'clasifica'
    level: string
    locale: string
    revisionStatus: 'draft' | 'approved' | 'frozen'
    contentVersion: number
    notes?: string
  }
  items: WordsClasificaItem[]
}

export type WordsPackIssue = { path: string; message: string }

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function validateWordsClasificaPack(raw: unknown): WordsPackIssue[] {
  const issues: WordsPackIssue[] = []
  if (!raw || typeof raw !== 'object') {
    return [{ path: '', message: 'El pack debe ser un objeto' }]
  }
  const root = raw as Record<string, unknown>
  if (root.schemaVersion !== WORDS_CLASIFICA_SCHEMA_VERSION) {
    issues.push({
      path: 'schemaVersion',
      message: `Se esperaba schemaVersion ${WORDS_CLASIFICA_SCHEMA_VERSION}`,
    })
  }
  if (!root.pack || typeof root.pack !== 'object') {
    issues.push({ path: 'pack', message: 'Falta pack' })
    return issues
  }
  const pack = root.pack as Record<string, unknown>
  if (pack.packKind !== 'clasifica') {
    issues.push({ path: 'pack.packKind', message: 'Debe ser clasifica' })
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
    if (!isNonEmptyString(row.word)) {
      issues.push({ path: `${base}.word`, message: 'word obligatorio' })
    }
    if (row.gender !== 'm' && row.gender !== 'f') {
      issues.push({ path: `${base}.gender`, message: 'm | f' })
    }
    if (row.number !== 'sg' && row.number !== 'pl') {
      issues.push({ path: `${base}.number`, message: 'sg | pl' })
    }
    if (
      row.article !== 'el' &&
      row.article !== 'la' &&
      row.article !== 'los' &&
      row.article !== 'las'
    ) {
      issues.push({ path: `${base}.article`, message: 'el | la | los | las' })
    }
  })
  return issues
}

export function assertValidWordsClasificaPack(
  raw: unknown,
): asserts raw is WordsClasificaPack {
  const issues = validateWordsClasificaPack(raw)
  if (issues.length > 0) {
    throw new Error(
      `[palabras/clasifica] pack inválido:\n` +
        issues.map((i) => `- ${i.path}: ${i.message}`).join('\n'),
    )
  }
}
