/**
 * Registro estable de packs de lemas de inglés (INGLES_JSON_SPEC).
 * Hub: 3 estaciones · tandas 1–2.
 */

import type { EnglishLemmaPack } from '@/feinetas/englishLemmaPack'
import { assertValidEnglishLemmaPack } from '@/feinetas/englishLemmaPack'
import food from '@feinetas/Ingles/food.json'
import numbers from '@feinetas/Ingles/numbers.json'
import thereIs from '@feinetas/Ingles/there-is.json'
import prepositions from '@feinetas/Ingles/prepositions.json'
import abilities from '@feinetas/Ingles/abilities.json'
import routines from '@feinetas/Ingles/routines.json'
import places from '@feinetas/Ingles/places.json'
import weather from '@feinetas/Ingles/weather.json'
import characters from '@feinetas/Ingles/characters.json'
import possessives from '@feinetas/Ingles/possessives.json'
import transport from '@feinetas/Ingles/transport.json'
import money from '@feinetas/Ingles/money.json'
import presentSimple from '@feinetas/Ingles/present-simple.json'
import presentContinuous from '@feinetas/Ingles/present-continuous.json'
import phrases from '@feinetas/Ingles/phrases.json'
import time from '@feinetas/Ingles/time.json'

export const ENGLISH_PACK_IDS = [
  'ingles-food',
  'ingles-numbers',
  'ingles-places',
  'ingles-weather',
  'ingles-characters',
  'ingles-transport',
  'ingles-money',
  'ingles-there-is',
  'ingles-prepositions',
  'ingles-possessives',
  'ingles-present-simple',
  'ingles-present-continuous',
  'ingles-time',
  'ingles-abilities',
  'ingles-routines',
  'ingles-phrases',
] as const

export type EnglishPackId = (typeof ENGLISH_PACK_IDS)[number]

export const ENGLISH_HUB_PACK_IDS: readonly EnglishPackId[] = ENGLISH_PACK_IDS

export type EnglishHubPackId = EnglishPackId

export const ENGLISH_PACK_LABELS: Record<string, string> = {
  'ingles-food': 'Comida',
  'ingles-numbers': 'Números',
  'ingles-places': 'Lugares',
  'ingles-weather': 'El tiempo',
  'ingles-characters': 'Personajes',
  'ingles-transport': 'Cómo voy',
  'ingles-money': 'Dinero',
  'ingles-there-is': 'There is / are',
  'ingles-prepositions': 'Preposiciones',
  'ingles-possessives': 'De quién es',
  'ingles-present-simple': 'Presente',
  'ingles-present-continuous': 'Ahora mismo',
  'ingles-time': '¿Qué hora es?',
  'ingles-abilities': 'Puedo',
  'ingles-routines': 'Rutinas',
  'ingles-phrases': 'Monta la frase',
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
  vocabulary: 'Palabras, lugares y más',
  grammar: 'Reglas con ayuda',
  phrases: 'Oraciones y chunks',
}

/** Packs por estación (tandas 1–2). */
export const ENGLISH_STATION_PACKS: Record<
  EnglishStationId,
  readonly EnglishPackId[]
> = {
  vocabulary: [
    'ingles-food',
    'ingles-numbers',
    'ingles-places',
    'ingles-weather',
    'ingles-characters',
    'ingles-transport',
    'ingles-money',
  ],
  grammar: [
    'ingles-there-is',
    'ingles-prepositions',
    'ingles-possessives',
    'ingles-present-simple',
    'ingles-present-continuous',
    'ingles-time',
  ],
  phrases: ['ingles-abilities', 'ingles-routines', 'ingles-phrases'],
}

/** Packs con modo Empareja (frase/chunk ↔ escena visual). */
export const ENGLISH_SCENE_MATCH_PACKS: readonly EnglishPackId[] = [
  'ingles-abilities',
  'ingles-routines',
  'ingles-transport',
  'ingles-places',
]

const RAW_PACKS: unknown[] = [
  food,
  numbers,
  places,
  weather,
  characters,
  transport,
  money,
  thereIs,
  prepositions,
  possessives,
  presentSimple,
  presentContinuous,
  time,
  abilities,
  routines,
  phrases,
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

export function englishPackSupportsSceneMatch(packId: string): boolean {
  return (ENGLISH_SCENE_MATCH_PACKS as readonly string[]).includes(packId)
}
