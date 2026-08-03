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
  listEnglishHubPacks,
  listEnglishPacks,
} from '@/feinetas/englishRegistry'
import { getEnglishCorpus } from '@/feinetas/englishCorpus'

const ARCHIVED: { raw: unknown; id: string; count: number }[] = [
  { raw: colours, id: 'ingles-colours-numbers', count: 30 },
  { raw: school, id: 'ingles-school', count: 26 },
  { raw: family, id: 'ingles-family', count: 18 },
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
      expect(pack.lemmas.every((l) => l.image.ref === null)).toBe(true)
      for (const L of pack.lemmas) {
        expect(L).not.toHaveProperty('errors')
        expect(L).not.toHaveProperty('ruleId')
        expect(L).not.toHaveProperty('options')
        expect(L.glossEs.length).toBeGreaterThan(0)
        expect(L.category.length).toBeGreaterThan(0)
      }
    })
  }

  it('registry runtime vacío (packs archivados fuera del hub)', () => {
    expect(ENGLISH_PACK_IDS).toHaveLength(0)
    expect(listEnglishPacks()).toHaveLength(0)
    expect(ENGLISH_HUB_PACK_IDS).toHaveLength(0)
    expect(listEnglishHubPacks()).toHaveLength(0)
    expect(getEnglishCorpus().entries).toHaveLength(0)
  })
})
