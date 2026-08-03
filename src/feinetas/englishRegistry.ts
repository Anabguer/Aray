/**
 * Registro estable de packs de lemas de inglés (INGLES_JSON_SPEC).
 * Runtime vacío: Colegio/Familia/Colores archivados en feinetas/Ingles/_archivo/
 * hasta categorizar nuevas fichas en _inbox/.
 */

import type { EnglishLemmaPack } from '@/feinetas/englishLemmaPack'
import { assertValidEnglishLemmaPack } from '@/feinetas/englishLemmaPack'

/** Packs cargados en runtime (vacío hasta nuevos JSON aprobados). */
export const ENGLISH_PACK_IDS = [] as const

export type EnglishPackId = string

/**
 * Packs visibles en el hub.
 * Vacío a propósito: estaciones nuevas tras categorizar fichas.
 */
export const ENGLISH_HUB_PACK_IDS: readonly EnglishPackId[] = []

export type EnglishHubPackId = EnglishPackId

/** Etiquetas legacy (archivo) + futuras; el hub no las usa mientras esté vacío. */
export const ENGLISH_PACK_LABELS: Record<string, string> = {
  'ingles-colours-numbers': 'Colores y números',
  'ingles-school': 'Colegio',
  'ingles-family': 'Familia',
}

const RAW_PACKS: unknown[] = []

function loadValidatedPacks(): EnglishLemmaPack[] {
  return RAW_PACKS.map((raw) => {
    assertValidEnglishLemmaPack(raw)
    return raw
  })
}

let cached: EnglishLemmaPack[] | null = null

export function listEnglishPacks(): EnglishLemmaPack[] {
  if (!cached) cached = loadValidatedPacks()
  return cached
}

/** Packs ofrecidos en Misiones → Inglés. */
export function listEnglishHubPacks(): EnglishLemmaPack[] {
  const hub = new Set<string>(ENGLISH_HUB_PACK_IDS)
  return listEnglishPacks().filter((p) => hub.has(p.pack.id))
}

export function getEnglishPack(packId: string): EnglishLemmaPack {
  const pack = listEnglishPacks().find((p) => p.pack.id === packId)
  if (!pack) throw new Error(`[ingles] Pack no registrado: ${packId}`)
  return pack
}

export function isEnglishPackId(id: string): id is EnglishPackId {
  return (ENGLISH_PACK_IDS as readonly string[]).includes(id)
}

export function isEnglishHubPackId(id: string): id is EnglishHubPackId {
  return (ENGLISH_HUB_PACK_IDS as readonly string[]).includes(id)
}
