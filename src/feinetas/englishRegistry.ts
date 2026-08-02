/**
 * Registro estable de packs de lemas de inglés (INGLES_JSON_SPEC).
 */
import type { EnglishLemmaPack } from '@/feinetas/englishLemmaPack'
import { assertValidEnglishLemmaPack } from '@/feinetas/englishLemmaPack'

import coloursNumbers from '@feinetas/Ingles/colours-numbers.json'
import school from '@feinetas/Ingles/school.json'
import family from '@feinetas/Ingles/family.json'

export const ENGLISH_PACK_IDS = [
  'ingles-colours-numbers',
  'ingles-school',
  'ingles-family',
] as const

export type EnglishPackId = (typeof ENGLISH_PACK_IDS)[number]

/**
 * Packs visibles en el hub (repaso 3.º).
 * Colours & Numbers queda en banco/JSON pero aparcado en UI (ciclo inicial).
 */
export const ENGLISH_HUB_PACK_IDS = [
  'ingles-school',
  'ingles-family',
] as const satisfies readonly EnglishPackId[]

export type EnglishHubPackId = (typeof ENGLISH_HUB_PACK_IDS)[number]

export const ENGLISH_PACK_LABELS: Record<EnglishPackId, string> = {
  'ingles-colours-numbers': 'Colores y números',
  'ingles-school': 'Colegio',
  'ingles-family': 'Familia',
}

const RAW_PACKS: unknown[] = [coloursNumbers, school, family]

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

/** Packs ofrecidos en Misiones → Inglés (repaso 3.º). */
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
