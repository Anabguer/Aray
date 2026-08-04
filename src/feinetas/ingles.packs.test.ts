import { describe, expect, it } from 'vitest'
import colours from '@feinetas/Ingles/_archivo/colours-numbers.json'
import school from '@feinetas/Ingles/_archivo/school.json'
import family from '@feinetas/Ingles/_archivo/family.json'
import food from '@feinetas/Ingles/food.json'
import numbers from '@feinetas/Ingles/numbers.json'
import thereIs from '@feinetas/Ingles/there-is.json'
import prepositions from '@feinetas/Ingles/prepositions.json'
import abilities from '@feinetas/Ingles/abilities.json'
import routines from '@feinetas/Ingles/routines.json'
import {
  ENGLISH_SCHEMA_VERSION,
  assertValidEnglishLemmaPack,
  validateEnglishLemmaPack,
  type EnglishLemmaPack,
} from '@/feinetas/englishLemmaPack'
import {
  ENGLISH_HUB_PACK_IDS,
  ENGLISH_PACK_IDS,
  ENGLISH_STATION_PACKS,
  listEnglishHubPacks,
  listEnglishPacks,
  listEnglishStationPacks,
} from '@/feinetas/englishRegistry'
import { getEnglishCorpus } from '@/feinetas/englishCorpus'

const ARCHIVED: { raw: unknown; id: string; count: number }[] = [
  { raw: colours, id: 'ingles-colours-numbers', count: 30 },
  { raw: school, id: 'ingles-school', count: 26 },
  { raw: family, id: 'ingles-family', count: 18 },
]

const TANDA1: { raw: unknown; id: string; count: number }[] = [
  { raw: food, id: 'ingles-food', count: 14 },
  { raw: numbers, id: 'ingles-numbers', count: 24 },
  { raw: thereIs, id: 'ingles-there-is', count: 10 },
  { raw: prepositions, id: 'ingles-prepositions', count: 6 },
  { raw: abilities, id: 'ingles-abilities', count: 12 },
  { raw: routines, id: 'ingles-routines', count: 10 },
]

describe('feinetas / ingles / packs JSON', () => {
  for (const { raw, id, count } of ARCHIVED) {
    it(`archivo ${id}: valida schema y cuenta ${count} lemas`, () => {
      const issues = validateEnglishLemmaPack(raw)
      expect(issues).toEqual([])
      assertValidEnglishLemmaPack(raw)
      const pack = raw as EnglishLemmaPack
      expect(pack.schemaVersion).toBe(ENGLISH_SCHEMA_VERSION)
      expect(pack.pack.id).toBe(id)
      expect(pack.pack.locale).toBe('en-GB')
      expect(pack.pack.revisionStatus).toBe('frozen')
      expect(pack.lemmas).toHaveLength(count)
    })
  }

  for (const { raw, id, count } of TANDA1) {
    it(`tanda1 ${id}: valida schema y cuenta ${count} lemas`, () => {
      const issues = validateEnglishLemmaPack(raw)
      expect(issues).toEqual([])
      assertValidEnglishLemmaPack(raw)
      const pack = raw as EnglishLemmaPack
      expect(pack.pack.id).toBe(id)
      expect(pack.pack.locale).toBe('en-GB')
      expect(pack.pack.revisionStatus).toBe('approved')
      expect(pack.lemmas).toHaveLength(count)
    })
  }

  it('registry runtime: 6 packs hub · 3 estaciones', () => {
    expect(ENGLISH_PACK_IDS).toHaveLength(6)
    expect(listEnglishPacks()).toHaveLength(6)
    expect(ENGLISH_HUB_PACK_IDS).toHaveLength(6)
    expect(listEnglishHubPacks()).toHaveLength(6)
    expect(getEnglishCorpus().entries.length).toBeGreaterThan(50)
    expect(listEnglishStationPacks('vocabulary').map((p) => p.pack.id)).toEqual([
      ...ENGLISH_STATION_PACKS.vocabulary,
    ])
    expect(listEnglishStationPacks('grammar')).toHaveLength(2)
    expect(listEnglishStationPacks('phrases')).toHaveLength(2)
  })
})
