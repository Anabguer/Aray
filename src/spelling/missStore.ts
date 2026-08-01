import type { SpellPlayMode, SpellRuleId } from '@/spelling/types'

export type SpellMissKey = {
  /** Palabra o id de contexto (p. ej. "perro" o "ctx:hay-1"). */
  key: string
  rule?: SpellRuleId
}

export type SpellMissEntry = {
  key: string
  rule?: SpellRuleId
  misses: number
  hits: number
  /** Aciertos seguidos desde el último fallo. */
  streakHits: number
  updatedAt: number
}

export type SpellMissStore = {
  version: 1
  entries: Record<string, SpellMissEntry>
}

const STORAGE_PREFIX = 'afk.spell.misses.v1.'

/** Tras tantos aciertos seguidos, se retira del banco de fallos. */
export const SPELL_MISS_CLEAR_STREAK = 3

function storageKey(playerId: string | number): string {
  return `${STORAGE_PREFIX}${playerId}`
}

function emptyStore(): SpellMissStore {
  return { version: 1, entries: {} }
}

export function loadSpellMisses(playerId: string | number | null | undefined): SpellMissStore {
  if (playerId == null || typeof localStorage === 'undefined') return emptyStore()
  try {
    const raw = localStorage.getItem(storageKey(playerId))
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as SpellMissStore
    if (!parsed || parsed.version !== 1 || typeof parsed.entries !== 'object') return emptyStore()
    return parsed
  } catch {
    return emptyStore()
  }
}

function saveSpellMisses(playerId: string | number, store: SpellMissStore) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(storageKey(playerId), JSON.stringify(store))
}

export function recordSpellMiss(
  playerId: string | number | null | undefined,
  input: { key: string; rule?: SpellRuleId; mode?: SpellPlayMode },
) {
  if (playerId == null || !input.key) return
  const store = loadSpellMisses(playerId)
  const prev = store.entries[input.key]
  store.entries[input.key] = {
    key: input.key,
    rule: input.rule ?? prev?.rule,
    misses: (prev?.misses ?? 0) + 1,
    hits: prev?.hits ?? 0,
    streakHits: 0,
    updatedAt: Date.now(),
  }
  saveSpellMisses(playerId, store)
}

export function recordSpellHit(
  playerId: string | number | null | undefined,
  input: { key: string; rule?: SpellRuleId },
) {
  if (playerId == null || !input.key) return
  const store = loadSpellMisses(playerId)
  const prev = store.entries[input.key]
  if (!prev) return
  const streakHits = prev.streakHits + 1
  if (streakHits >= SPELL_MISS_CLEAR_STREAK) {
    delete store.entries[input.key]
  } else {
    store.entries[input.key] = {
      ...prev,
      rule: input.rule ?? prev.rule,
      hits: prev.hits + 1,
      streakHits,
      updatedAt: Date.now(),
    }
  }
  saveSpellMisses(playerId, store)
}

/** Fallos activos ordenados por peso (más fallos / más recientes primero). */
export function listActiveSpellMisses(
  playerId: string | number | null | undefined,
): SpellMissEntry[] {
  const store = loadSpellMisses(playerId)
  return Object.values(store.entries).sort((a, b) => {
    const wa = a.misses * 10 - a.hits + a.updatedAt / 1e13
    const wb = b.misses * 10 - b.hits + b.updatedAt / 1e13
    return wb - wa
  })
}

export function countActiveSpellMisses(playerId: string | number | null | undefined): number {
  return listActiveSpellMisses(playerId).length
}

export { isLegacyCompleteMissKey } from '@/spelling/legacyComplete'
export {
  ortographyMissKey,
  parseOrtographyMissKey,
} from '@/feinetas/ortographyCorpus'
