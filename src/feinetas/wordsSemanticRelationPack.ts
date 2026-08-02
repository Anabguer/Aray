/**
 * Pack de relaciones semánticas (Palabras) — schemaVersion 1.
 * Ver feinetas/editorial/PALABRAS_JSON_SPEC.md
 */

export const WORDS_SEMANTIC_RELATION_SCHEMA_VERSION = 1 as const

export type WordsRevisionStatus = 'draft' | 'approved' | 'frozen'

export type WordsSemanticRelationKind = 'synonym' | 'antonym'

export type WordsSemanticRelationItem = {
  id: string
  anchor: string
  target: string
  relation: WordsSemanticRelationKind
  distractors: string[]
  difficulty: number
  category?: string
  ruleText?: string
  notes?: string
  tags?: string[]
  status?: 'active' | 'deprecated'
}

export type WordsSemanticRelationPackMeta = {
  id: string
  title: string
  ownerBank: string
  packKind: 'semantic-relation'
  level: string
  locale: string
  revisionStatus: WordsRevisionStatus
  contentVersion: number
  sourceEditorialPhase?: string
  notes?: string
}

export type WordsSemanticRelationPack = {
  schemaVersion: number
  pack: WordsSemanticRelationPackMeta
  items: WordsSemanticRelationItem[]
}

export type WordsPackIssue = {
  path: string
  message: string
}

const PENDING_MARKERS = [
  'revisión aparte',
  'revision aparte',
  'pendiente',
  'coming-soon',
] as const

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeLemma(value: string): string {
  return value.trim().toLocaleLowerCase('es')
}

/** Clave no dirigida: misma relación A↔B no puede existir en ambos sentidos. */
export function undirectedRelationKey(
  relation: string,
  a: string,
  b: string,
): string {
  const pair = [normalizeLemma(a), normalizeLemma(b)].sort()
  return `${relation}|${pair[0]}|${pair[1]}`
}

export function validateWordsSemanticRelationPack(raw: unknown): WordsPackIssue[] {
  const issues: WordsPackIssue[] = []
  if (!raw || typeof raw !== 'object') {
    return [{ path: '', message: 'El pack debe ser un objeto' }]
  }
  const root = raw as Record<string, unknown>

  if (root.schemaVersion !== WORDS_SEMANTIC_RELATION_SCHEMA_VERSION) {
    issues.push({
      path: 'schemaVersion',
      message: `Se esperaba schemaVersion ${WORDS_SEMANTIC_RELATION_SCHEMA_VERSION}`,
    })
  }

  if (!root.pack || typeof root.pack !== 'object') {
    issues.push({ path: 'pack', message: 'Falta pack' })
    return issues
  }
  const pack = root.pack as Record<string, unknown>

  for (const key of [
    'id',
    'title',
    'ownerBank',
    'packKind',
    'level',
    'locale',
    'revisionStatus',
  ] as const) {
    if (!isNonEmptyString(pack[key])) {
      issues.push({ path: `pack.${key}`, message: 'Campo obligatorio' })
    }
  }
  if (pack.packKind !== 'semantic-relation') {
    issues.push({
      path: 'pack.packKind',
      message: 'Debe ser semantic-relation',
    })
  }
  if (
    pack.revisionStatus !== 'draft' &&
    pack.revisionStatus !== 'approved' &&
    pack.revisionStatus !== 'frozen'
  ) {
    issues.push({
      path: 'pack.revisionStatus',
      message: 'draft | approved | frozen',
    })
  }
  if (typeof pack.contentVersion !== 'number' || pack.contentVersion < 1) {
    issues.push({
      path: 'pack.contentVersion',
      message: 'contentVersion >= 1',
    })
  }

  if (!Array.isArray(root.items)) {
    issues.push({ path: 'items', message: 'items debe ser un array' })
    return issues
  }

  const ids = new Set<string>()
  const directed = new Set<string>()
  const undirected = new Set<string>()

  root.items.forEach((item, index) => {
    const base = `items[${index}]`
    if (!item || typeof item !== 'object') {
      issues.push({ path: base, message: 'Ítem inválido' })
      return
    }
    const row = item as Record<string, unknown>

    if (!isNonEmptyString(row.id)) {
      issues.push({ path: `${base}.id`, message: 'id obligatorio' })
    } else {
      if (ids.has(row.id)) {
        issues.push({ path: `${base}.id`, message: `id duplicado: ${row.id}` })
      }
      ids.add(row.id)
      if (!/^rel-/.test(row.id)) {
        issues.push({
          path: `${base}.id`,
          message: 'id debe empezar por rel-',
        })
      }
    }

    if (!isNonEmptyString(row.anchor)) {
      issues.push({ path: `${base}.anchor`, message: 'anchor obligatorio' })
    }
    if (!isNonEmptyString(row.target)) {
      issues.push({ path: `${base}.target`, message: 'target obligatorio' })
    }
    if (row.relation !== 'synonym' && row.relation !== 'antonym') {
      issues.push({
        path: `${base}.relation`,
        message: 'synonym | antonym',
      })
    }

    if (
      typeof row.difficulty !== 'number' ||
      !Number.isInteger(row.difficulty) ||
      row.difficulty < 1 ||
      row.difficulty > 4
    ) {
      issues.push({
        path: `${base}.difficulty`,
        message: 'difficulty entero 1–4',
      })
    }

    if (!Array.isArray(row.distractors) || row.distractors.length < 2) {
      issues.push({
        path: `${base}.distractors`,
        message: 'distractors editoriales: mínimo 2',
      })
    } else {
      const seen = new Set<string>()
      for (const [dIndex, d] of row.distractors.entries()) {
        if (!isNonEmptyString(d)) {
          issues.push({
            path: `${base}.distractors[${dIndex}]`,
            message: 'distractor vacío',
          })
          continue
        }
        const n = normalizeLemma(d)
        if (seen.has(n)) {
          issues.push({
            path: `${base}.distractors[${dIndex}]`,
            message: 'distractor duplicado',
          })
        }
        seen.add(n)
        if (
          isNonEmptyString(row.anchor) &&
          n === normalizeLemma(row.anchor)
        ) {
          issues.push({
            path: `${base}.distractors[${dIndex}]`,
            message: 'distractor no puede ser el anchor',
          })
        }
        if (
          isNonEmptyString(row.target) &&
          n === normalizeLemma(row.target)
        ) {
          issues.push({
            path: `${base}.distractors[${dIndex}]`,
            message: 'distractor no puede ser el target',
          })
        }
      }
    }

    if (
      isNonEmptyString(row.anchor) &&
      isNonEmptyString(row.target) &&
      (row.relation === 'synonym' || row.relation === 'antonym')
    ) {
      const dir = `${row.relation}|${normalizeLemma(row.anchor)}|${normalizeLemma(row.target)}`
      if (directed.has(dir)) {
        issues.push({
          path: base,
          message: `relación dirigida duplicada: ${dir}`,
        })
      }
      directed.add(dir)

      const und = undirectedRelationKey(row.relation, row.anchor, row.target)
      if (undirected.has(und)) {
        issues.push({
          path: base,
          message: `par espejo / relación no dirigida duplicada: ${und}`,
        })
      }
      undirected.add(und)

      if (normalizeLemma(row.anchor) === normalizeLemma(row.target)) {
        issues.push({
          path: base,
          message: 'anchor y target no pueden ser iguales',
        })
      }
    }

    for (const field of ['notes', 'ruleText', 'category'] as const) {
      const value = row[field]
      if (typeof value !== 'string') continue
      const lower = value.toLocaleLowerCase('es')
      for (const marker of PENDING_MARKERS) {
        if (lower.includes(marker)) {
          issues.push({
            path: `${base}.${field}`,
            message: `marca de pendiente prohibida: "${marker}"`,
          })
        }
      }
    }
  })

  if (typeof pack.notes === 'string') {
    const lower = pack.notes.toLocaleLowerCase('es')
    for (const marker of PENDING_MARKERS) {
      if (marker === 'pendiente' && lower.includes('no conectado')) {
        continue
      }
      if (lower.includes(marker) && marker !== 'pendiente') {
        issues.push({
          path: 'pack.notes',
          message: `marca de pendiente prohibida: "${marker}"`,
        })
      }
    }
  }

  return issues
}

export function assertValidWordsSemanticRelationPack(
  raw: unknown,
): asserts raw is WordsSemanticRelationPack {
  const issues = validateWordsSemanticRelationPack(raw)
  if (issues.length > 0) {
    throw new Error(
      `[palabras/relaciones] pack inválido:\n` +
        issues.map((i) => `- ${i.path}: ${i.message}`).join('\n'),
    )
  }
}
