/**
 * Mis fallos de Matemáticas (calc / money / clocks).
 * Persistencia local por jugador (mismo patrón que Ortografía).
 * No sincroniza con el servidor todavía — ver docs/MATHS_MISSES.md.
 */
import {
  questionIdFromPayload,
  type MathsMissPayload,
  type MathsMissSkillId,
} from '@/math/missIds'

export type MathsMissEntry = {
  questionId: string
  skillId: MathsMissSkillId
  modeId: string
  difficulty?: string
  /** Snapshot completo para reconstrucción exacta. */
  payload: MathsMissPayload
  misses: number
  hits: number
  /** Aciertos seguidos desde el último fallo. */
  streakHits: number
  updatedAt: number
}

export type MathsMissStore = {
  version: 1
  entries: Record<string, MathsMissEntry>
}

const STORAGE_PREFIX = 'afk.maths.misses.v1.'

/** Tras tantos aciertos seguidos, se retira del banco de fallos. */
export const MATHS_MISS_CLEAR_STREAK = 3

function storageKey(playerId: string | number): string {
  return `${STORAGE_PREFIX}${playerId}`
}

function emptyStore(): MathsMissStore {
  return { version: 1, entries: {} }
}

export function loadMathsMisses(playerId: string | number | null | undefined): MathsMissStore {
  if (playerId == null || typeof localStorage === 'undefined') return emptyStore()
  try {
    const raw = localStorage.getItem(storageKey(playerId))
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as MathsMissStore
    if (!parsed || parsed.version !== 1 || typeof parsed.entries !== 'object') return emptyStore()
    return parsed
  } catch {
    return emptyStore()
  }
}

function saveMathsMisses(playerId: string | number, store: MathsMissStore) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(storageKey(playerId), JSON.stringify(store))
}

/** Solo tests / reset. */
export function clearMathsMisses(playerId: string | number | null | undefined) {
  if (playerId == null || typeof localStorage === 'undefined') return
  localStorage.removeItem(storageKey(playerId))
}

export function recordMathsMiss(
  playerId: string | number | null | undefined,
  payload: MathsMissPayload,
) {
  if (playerId == null) return
  const questionId = questionIdFromPayload(payload)
  if (!questionId) return
  const store = loadMathsMisses(playerId)
  const prev = store.entries[questionId]
  store.entries[questionId] = {
    questionId,
    skillId: payload.skillId,
    modeId: payload.modeId,
    difficulty: payload.skillId === 'calc' ? payload.difficulty : prev?.difficulty,
    payload: prev?.payload ?? payload,
    misses: (prev?.misses ?? 0) + 1,
    hits: prev?.hits ?? 0,
    streakHits: 0,
    updatedAt: Date.now(),
  }
  saveMathsMisses(playerId, store)
}

export function recordMathsHit(
  playerId: string | number | null | undefined,
  questionId: string,
) {
  if (playerId == null || !questionId) return
  const store = loadMathsMisses(playerId)
  const prev = store.entries[questionId]
  if (!prev) return
  const streakHits = prev.streakHits + 1
  if (streakHits >= MATHS_MISS_CLEAR_STREAK) {
    delete store.entries[questionId]
  } else {
    store.entries[questionId] = {
      ...prev,
      hits: prev.hits + 1,
      streakHits,
      updatedAt: Date.now(),
    }
  }
  saveMathsMisses(playerId, store)
}

/** Fallos activos de una categoría, priorizados por fallos y frescura. */
export function listActiveMathsMisses(
  playerId: string | number | null | undefined,
  skillId?: MathsMissSkillId,
): MathsMissEntry[] {
  const store = loadMathsMisses(playerId)
  return Object.values(store.entries)
    .filter((e) => (skillId ? e.skillId === skillId : true))
    .sort((a, b) => {
      const wa = a.misses * 10 - a.hits + a.updatedAt / 1e13
      const wb = b.misses * 10 - b.hits + b.updatedAt / 1e13
      return wb - wa
    })
}

export function countActiveMathsMisses(
  playerId: string | number | null | undefined,
  skillId?: MathsMissSkillId,
): number {
  return listActiveMathsMisses(playerId, skillId).length
}

export function rebuildCalcFromMiss(entry: MathsMissEntry) {
  if (entry.payload.skillId !== 'calc') throw new Error('not calc')
  return entry.payload.question
}

export function rebuildMoneyFromMiss(entry: MathsMissEntry) {
  if (entry.payload.skillId !== 'money') throw new Error('not money')
  return entry.payload.question
}

export function rebuildClockFromMiss(entry: MathsMissEntry) {
  if (entry.payload.skillId !== 'clocks') throw new Error('not clocks')
  return { question: entry.payload.question, lang: entry.payload.lang }
}
