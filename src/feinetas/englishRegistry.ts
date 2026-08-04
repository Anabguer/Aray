/**
 * Registro estable de packs de lemas de inglés (INGLES_JSON_SPEC).
 * Primera tanda hub: 6 packs bajo 3 estaciones (Vocabulario / Gramática / Frases).
 */

import type { EnglishLemmaPack } from '@/feinetas/englishLemmaPack'
import { assertValidEnglishLemmaPack } from '@/feinetas/englishLemmaPack'
import food from '@feinetas/Ingles/food.json'
import numbers from '@feinetas/Ingles/numbers.json'
import thereIs from '@feinetas/Ingles/there-is.json'
import prepositions from '@feinetas/Ingles/prepositions.json'
import abilities from '@feinetas/Ingles/abilities.json'
import routines from '@feinetas/Ingles/routines.json'

export const ENGLISH_PACK_IDS = [
  'ingles-food',
  'ingles-numbers',
  'ingles-there-is',
  'ingles-prepositions',
  'ingles-abilities',
  'ingles-routines',
] as const

export type EnglishPackId = (typeof ENGLISH_PACK_IDS)[number]

/** Packs visibles en el hub (primera tanda). */
export const ENGLISH_HUB_PACK_IDS: readonly EnglishPackId[] = ENGLISH_PACK_IDS

export type EnglishHubPackId = EnglishPackId

export const ENGLISH_PACK_LABELS: Record<string, string> = {
  'ingles-food': 'Comida',
  'ingles-numbers': 'Números',
  'ingles-there-is': 'There is / are',
  'ingles-prepositions': 'Preposiciones',
  'ingles-abilities': 'Puedo',
  'ingles-routines': 'Rutinas',
  'ingles-colours-numbers': 'Colores y números',
  'ingles-school': 'Colegio',
  'ingles-family': 'Familia',
}

export type EnglishStationId = 'vocabulary' | 'grammar' | 'phrases'

export const ENGLISH_STATION_IDS: readonly EnglishStationId[] = [
  'vocabulary',
  'grammar',
  'phrases',
] as const

export const ENGLISH_STATION_LABELS: Record<EnglishStationId, string> = {
  vocabulary: 'Vocabulario',
  grammar: 'Gramática',
  phrases: 'Frases',
}

export const ENGLISH_STATION_BLURBS: Record<EnglishStationId, string> = {
  vocabulary: 'Palabras y números',
  grammar: 'Reglas con ayuda',
  phrases: 'Oraciones y chunks',
}

/** Packs de la primera tanda por estación. */
export const ENGLISH_STATION_PACKS: Record<
  EnglishStationId,
  readonly EnglishPackId[]
> = {
  vocabulary: ['ingles-food', 'ingles-numbers'],
  grammar: ['ingles-there-is', 'ingles-prepositions'],
  phrases: ['ingles-abilities', 'ingles-routines'],
}

const RAW_PACKS: unknown[] = [
  food,
  numbers,
  thereIs,
  prepositions,
  abilities,
  routines,
]

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

export function isEnglishStationId(id: string): id is EnglishStationId {
  return (ENGLISH_STATION_IDS as readonly string[]).includes(id)
}

export function stationForEnglishPack(
  packId: string,
): EnglishStationId | null {
  for (const station of ENGLISH_STATION_IDS) {
    if ((ENGLISH_STATION_PACKS[station] as readonly string[]).includes(packId)) {
      return station
    }
  }
  return null
}

export function listEnglishStationPacks(
  stationId: EnglishStationId,
): EnglishLemmaPack[] {
  const ids = new Set(ENGLISH_STATION_PACKS[stationId])
  return listEnglishHubPacks().filter((p) => ids.has(p.pack.id as EnglishPackId))
}
