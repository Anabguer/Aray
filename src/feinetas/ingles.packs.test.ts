import { describe, expect, it } from 'vitest'
import colours from '@feinetas/Ingles/_archivo/colours-numbers.json'
import school from '@feinetas/Ingles/_archivo/school.json'
import family from '@feinetas/Ingles/_archivo/family.json'
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
import { buildEnglishMatchSession } from '@/minigames/adapters/englishSceneMatch'

const ARCHIVED: { raw: unknown; id: string; count: number }[] = [
  { raw: colours, id: 'ingles-colours-numbers', count: 30 },
  { raw: school, id: 'ingles-school', count: 26 },
  { raw: family, id: 'ingles-family', count: 18 },
]

describe('feinetas / ingles / packs JSON', () => {
  for (const { raw, id, count } of ARCHIVED) {
    it(`archivo ${id}: valida schema y cuenta ${count} lemas`, () => {
      expect(validateEnglishLemmaPack(raw)).toEqual([])
      assertValidEnglishLemmaPack(raw)
      const pack = raw as EnglishLemmaPack
      expect(pack.schemaVersion).toBe(ENGLISH_SCHEMA_VERSION)
      expect(pack.pack.id).toBe(id)
      expect(pack.lemmas).toHaveLength(count)
    })
  }

  it('registry runtime: 16 packs · 3 estaciones', () => {
    expect(ENGLISH_PACK_IDS).toHaveLength(16)
    expect(listEnglishPacks()).toHaveLength(16)
    expect(ENGLISH_HUB_PACK_IDS).toHaveLength(16)
    expect(listEnglishHubPacks()).toHaveLength(16)
    expect(getEnglishCorpus().entries.length).toBeGreaterThan(140)
    expect(listEnglishStationPacks('vocabulary')).toHaveLength(
      ENGLISH_STATION_PACKS.vocabulary.length,
    )
    expect(listEnglishStationPacks('grammar')).toHaveLength(
      ENGLISH_STATION_PACKS.grammar.length,
    )
    expect(listEnglishStationPacks('phrases')).toHaveLength(
      ENGLISH_STATION_PACKS.phrases.length,
    )
  })

  it('cada pack runtime valida schema', () => {
    for (const pack of listEnglishPacks()) {
      expect(validateEnglishLemmaPack(pack)).toEqual([])
      expect(pack.pack.locale).toBe('en-GB')
    }
  })

  it('scene-match construye tableros para packs de emparejar', () => {
    for (const packId of [
      'ingles-abilities',
      'ingles-routines',
      'ingles-transport',
      'ingles-places',
    ] as const) {
      const boards = buildEnglishMatchSession(packId, 2, 7)
      expect(boards).toHaveLength(2)
      expect(boards[0]!.pairs).toHaveLength(4)
      expect(boards[0]!.leftOrder).toHaveLength(4)
    }
  })
})
