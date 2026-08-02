/**
 * Pack de morfología (Palabras) — schemaVersion 1.
 * Ver feinetas/editorial/PALABRAS_JSON_SPEC.md (§ morph-pair)
 */

export const WORDS_MORPH_PAIR_SCHEMA_VERSION = 1 as const

export type WordsRevisionStatus = 'draft' | 'approved' | 'frozen'

export type WordsMorphAxis = 'number' | 'gender'

export type WordsMorphPromptSide = 'a' | 'b' | 'either'

export type WordsMorphPairItem = {
  id: string
  formA: string
  formB: string
  axis: WordsMorphAxis
  promptSide: WordsMorphPromptSide
  difficulty: number
  category?: string
  notes?: string
  note?: string
  distractors?: string[]
  tags?: string[]
  status?: 'active' | 'deprecated'
}

export type WordsMorphPairPackMeta = {
  id: string
  title: string
  ownerBank: string
  packKind: 'morph-pair'
  level: string
  locale: string
  revisionStatus: WordsRevisionStatus
  contentVersion: number
  sourceEditorialPhase?: string
  notes?: string
}

export type WordsMorphPairPack = {
  schemaVersion: number
  pack: WordsMorphPairPackMeta
  items: WordsMorphPairItem[]
}

export type WordsPackIssue = {
  path: string
  message: string
}

const PENDING_MARKERS = [
  'revisión aparte',
  'revision aparte',
  'coming-soon',
] as const

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeLemma(value: string): string {
  return value.trim().toLocaleLowerCase('es')
}

/** Misma axis + mismas dos formas (orden indiferente) = duplicado / espejo. */
export function undirectedMorphKey(axis: string, a: string, b: string): string {
  const pair = [normalizeLemma(a), normalizeLemma(b)].sort()
  return `${axis}|${pair[0]}|${pair[1]}`
}

export function validateWordsMorphPairPack(raw: unknown): WordsPackIssue[] {
  const issues: WordsPackIssue[] = []
  if (!raw || typeof raw !== 'object') {
    return [{ path: '', message: 'El pack debe ser un objeto' }]
  }
  const root = raw as Record<string, unknown>

  if (root.schemaVersion !== WORDS_MORPH_PAIR_SCHEMA_VERSION) {
    issues.push({
      path: 'schemaVersion',
      message: `Se esperaba schemaVersion ${WORDS_MORPH_PAIR_SCHEMA_VERSION}`,
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
  if (pack.packKind !== 'morph-pair') {
    issues.push({ path: 'pack.packKind', message: 'Debe ser morph-pair' })
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
      if (!/^morph-(num|gen)-/.test(row.id)) {
        issues.push({
          path: `${base}.id`,
          message: 'id debe empezar por morph-num- o morph-gen-',
        })
      }
    }

    if (!isNonEmptyString(row.formA)) {
      issues.push({ path: `${base}.formA`, message: 'formA obligatorio' })
    }
    if (!isNonEmptyString(row.formB)) {
      issues.push({ path: `${base}.formB`, message: 'formB obligatorio' })
    }
    if (row.axis !== 'number' && row.axis !== 'gender') {
      issues.push({ path: `${base}.axis`, message: 'number | gender' })
    }
    if (row.promptSide !== 'a' && row.promptSide !== 'b' && row.promptSide !== 'either') {
      issues.push({
        path: `${base}.promptSide`,
        message: 'a | b | either',
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

    if (
      isNonEmptyString(row.formA) &&
      isNonEmptyString(row.formB) &&
      (row.axis === 'number' || row.axis === 'gender')
    ) {
      if (normalizeLemma(row.formA) === normalizeLemma(row.formB)) {
        issues.push({
          path: base,
          message: 'formA y formB no pueden ser iguales',
        })
      }
      const und = undirectedMorphKey(row.axis, row.formA, row.formB)
      if (undirected.has(und)) {
        issues.push({
          path: base,
          message: `par duplicado / espejo en el mismo axis: ${und}`,
        })
      }
      undirected.add(und)
    }

    if (Array.isArray(row.distractors)) {
      for (const [dIndex, d] of row.distractors.entries()) {
        if (!isNonEmptyString(d)) {
          issues.push({
            path: `${base}.distractors[${dIndex}]`,
            message: 'distractor vacío',
          })
          continue
        }
        const n = normalizeLemma(d)
        if (isNonEmptyString(row.formA) && n === normalizeLemma(row.formA)) {
          issues.push({
            path: `${base}.distractors[${dIndex}]`,
            message: 'distractor no puede ser formA',
          })
        }
        if (isNonEmptyString(row.formB) && n === normalizeLemma(row.formB)) {
          issues.push({
            path: `${base}.distractors[${dIndex}]`,
            message: 'distractor no puede ser formB',
          })
        }
      }
    }

    for (const field of ['notes', 'note', 'category'] as const) {
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

  return issues
}

export function assertValidWordsMorphPairPack(
  raw: unknown,
): asserts raw is WordsMorphPairPack {
  const issues = validateWordsMorphPairPack(raw)
  if (issues.length > 0) {
    throw new Error(
      `[palabras/morfologia] pack inválido:\n` +
        issues.map((i) => `- ${i.path}: ${i.message}`).join('\n'),
    )
  }
}
