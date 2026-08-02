import type { EnglishPlayMode } from '@/english/types'

export type EnglishMissEntry = {
  key: string
  /** Modo en el que falló (para reconstruir la misma mecánica). */
  mode: Exclude<EnglishPlayMode, 'mix' | 'review'>
  misses: number
  hits: number
  streakHits: number
  updatedAt: number
}

export type EnglishMissStore = {
  version: 1
  entries: Record<string, EnglishMissEntry>
}

const STORAGE_PREFIX = 'afk.english.misses.v1.'

export const ENGLISH_MISS_CLEAR_STREAK = 3

function storageKey(playerId: string | number): string {
  return `${STORAGE_PREFIX}${playerId}`
}

function emptyStore(): EnglishMissStore {
  return { version: 1, entries: {} }
}

export function loadEnglishMisses(
  playerId: string | number | null | undefined,
): EnglishMissStore {
  if (playerId == null || typeof localStorage === 'undefined') return emptyStore()
  try {
    const raw = localStorage.getItem(storageKey(playerId))
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as EnglishMissStore
    if (!parsed || parsed.version !== 1 || typeof parsed.entries !== 'object') {
      return emptyStore()
    }
    return parsed
  } catch {
    return emptyStore()
  }
}

function saveEnglishMisses(playerId: string | number, store: EnglishMissStore) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(storageKey(playerId), JSON.stringify(store))
}

export function recordEnglishMiss(
  playerId: string | number | null | undefined,
  input: {
    key: string
    mode: Exclude<EnglishPlayMode, 'mix' | 'review'>
  },
) {
  if (playerId == null || !input.key) return
  const store = loadEnglishMisses(playerId)
  const prev = store.entries[input.key]
  store.entries[input.key] = {
    key: input.key,
    mode: input.mode,
    misses: (prev?.misses ?? 0) + 1,
    hits: prev?.hits ?? 0,
    streakHits: 0,
    updatedAt: Date.now(),
  }
  saveEnglishMisses(playerId, store)
}

export function recordEnglishHit(
  playerId: string | number | null | undefined,
  input: { key: string },
) {
  if (playerId == null || !input.key) return
  const store = loadEnglishMisses(playerId)
  const prev = store.entries[input.key]
  if (!prev) return
  const streakHits = prev.streakHits + 1
  if (streakHits >= ENGLISH_MISS_CLEAR_STREAK) {
    delete store.entries[input.key]
  } else {
    store.entries[input.key] = {
      ...prev,
      hits: prev.hits + 1,
      streakHits,
      updatedAt: Date.now(),
    }
  }
  saveEnglishMisses(playerId, store)
}

export function listActiveEnglishMisses(
  playerId: string | number | null | undefined,
  packId?: string,
): EnglishMissEntry[] {
  const store = loadEnglishMisses(playerId)
  let entries = Object.values(store.entries)
  if (packId) {
    const prefix = `${packId}:`
    entries = entries.filter((e) => e.key.startsWith(prefix))
  }
  return entries.sort((a, b) => {
    const wa = a.misses * 10 - a.hits + a.updatedAt / 1e13
    const wb = b.misses * 10 - b.hits + b.updatedAt / 1e13
    return wb - wa
  })
}

export function countActiveEnglishMisses(
  playerId: string | number | null | undefined,
  packId?: string,
): number {
  return listActiveEnglishMisses(playerId, packId).length
}

export {
  englishMissKey,
  parseEnglishMissKey,
} from '@/feinetas/englishCorpus'
