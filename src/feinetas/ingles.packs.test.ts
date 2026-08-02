import { describe, expect, it } from 'vitest'
import colours from '@feinetas/Ingles/colours-numbers.json'
import school from '@feinetas/Ingles/school.json'
import family from '@feinetas/Ingles/family.json'
import {
  ENGLISH_SCHEMA_VERSION,
  assertValidEnglishLemmaPack,
  validateEnglishLemmaPack,
  type EnglishLemmaPack,
} from '@/feinetas/englishLemmaPack'
import {
  ENGLISH_HUB_PACK_IDS,
  ENGLISH_PACK_IDS,
  getEnglishPack,
  listEnglishHubPacks,
  listEnglishPacks,
} from '@/feinetas/englishRegistry'
import { getEnglishCorpus } from '@/feinetas/englishCorpus'

const PACKS: { raw: unknown; id: string; count: number }[] = [
  { raw: colours, id: 'ingles-colours-numbers', count: 30 },
  { raw: school, id: 'ingles-school', count: 26 },
  { raw: family, id: 'ingles-family', count: 18 },
]

describe('feinetas / ingles / packs JSON', () => {
  for (const { raw, id, count } of PACKS) {
    it(`${id}: valida schema y cuenta ${count} lemas`, () => {
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
      // Banco editorial: sin errors[] / ruleId / opciones
      for (const L of pack.lemmas) {
        expect(L).not.toHaveProperty('errors')
        expect(L).not.toHaveProperty('ruleId')
        expect(L).not.toHaveProperty('options')
        expect(L.glossEs.length).toBeGreaterThan(0)
        expect(L.category.length).toBeGreaterThan(0)
      }
    })
  }

  it('registry carga exactamente 3 packs y 74 lemas en corpus', () => {
    expect(ENGLISH_PACK_IDS).toHaveLength(3)
    expect(listEnglishPacks()).toHaveLength(3)
    expect(getEnglishPack('ingles-family').lemmas).toHaveLength(18)
    expect(getEnglishCorpus().entries).toHaveLength(74)
  })

  it('hub de repaso 3.º solo ofrece Colegio y Familia', () => {
    expect([...ENGLISH_HUB_PACK_IDS]).toEqual([
      'ingles-school',
      'ingles-family',
    ])
    expect(listEnglishHubPacks().map((p) => p.pack.id)).toEqual([
      'ingles-school',
      'ingles-family',
    ])
  })

  it('glosas ES únicas dentro de cada pack (salvo variantes aunt/auntie documentadas)', () => {
    for (const id of ENGLISH_PACK_IDS) {
      const glosses = getEnglishPack(id).lemmas.map((l) =>
        l.glossEs.toLocaleLowerCase('es'),
      )
      const unique = new Set(glosses).size
      if (id === 'ingles-family') {
        // aunt / auntie: misma glosa ES a propósito (INGLES_FAMILY.md).
        expect(unique).toBe(glosses.length - 1)
      } else {
        expect(unique).toBe(glosses.length)
      }
    }
  })
})
