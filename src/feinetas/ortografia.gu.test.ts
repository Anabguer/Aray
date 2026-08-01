import { describe, expect, it } from 'vitest'
import packJson from '@feinetas/ortografia/gu.json'
import {
  assertValidOrtographyLemmaPack,
  validateOrtographyLemmaPack,
  type OrtographyLemmaPack,
} from '@/feinetas/ortographyLemmaPack'
import { listRegisteredFeinetas } from '@/feinetas/registry'

const EXPECTED = [
  'guitarra',
  'cigüeña',
  'pingüino',
  'águila',
  'guerra',
  'guante',
  'antigüedad',
  'guerrero',
  'guinda',
] as const

describe('feinetas / ortografia / gu', () => {
  it('valida schema y metadatos approved', () => {
    expect(validateOrtographyLemmaPack(packJson)).toEqual([])
    assertValidOrtographyLemmaPack(packJson)
    const pack = packJson as OrtographyLemmaPack
    expect(pack.pack.id).toBe('ortografia-gu')
    expect(pack.pack.revisionStatus).toBe('approved')
    expect(pack.pack.ruleFamily).toBe('gu-gue')
  })

  it('9 lemas en orden del MD', () => {
    const pack = packJson as OrtographyLemmaPack
    expect(pack.lemmas.map((l) => l.lemma)).toEqual([...EXPECTED])
    expect(new Set(pack.lemmas.map((l) => l.id)).size).toBe(9)
  })

  it('ids gu-* y ruleId gu-gue', () => {
    const pack = packJson as OrtographyLemmaPack
    for (const item of pack.lemmas) {
      expect(item.id).toMatch(/^gu-/)
      expect(item.ruleId).toBe('gu-gue')
      expect(item.errors.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('no está en el catálogo jugable', () => {
    expect(listRegisteredFeinetas()).toEqual(['formar-palabras'])
  })
})
