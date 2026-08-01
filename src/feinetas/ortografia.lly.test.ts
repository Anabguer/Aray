import { describe, expect, it } from 'vitest'
import llyPack from '@feinetas/ortografia/lly.json'
import {
  ORTOGRAPHY_SCHEMA_VERSION,
  assertValidOrtographyLemmaPack,
  validateOrtographyLemmaPack,
  type OrtographyLemmaPack,
} from '@/feinetas/ortographyLemmaPack'
import { listRegisteredFeinetas } from '@/feinetas/registry'

const EXPECTED_LEMMAS = [
  'amarillo',
  'silla',
  'lluvia',
  'playa',
  'calle',
  'estrella',
  'llegar',
  'ayer',
  'llevar',
  'tortilla',
  'rastrillo',
  'ardilla',
  'pollo',
  'martillo',
  'ladrillo',
  'brillar',
  'reyes',
  'pajarillo',
] as const

describe('feinetas / ortografia / lly', () => {
  it('pasa schemaVersion 1', () => {
    expect(validateOrtographyLemmaPack(llyPack)).toEqual([])
    assertValidOrtographyLemmaPack(llyPack)
  })

  it('metadatos approved', () => {
    const pack = llyPack as OrtographyLemmaPack
    expect(pack.schemaVersion).toBe(ORTOGRAPHY_SCHEMA_VERSION)
    expect(pack.pack.id).toBe('ortografia-lly')
    expect(pack.pack.ownerBank).toBe('ERRORES_REALES_LLY.md')
    expect(pack.pack.ruleFamily).toBe('ll-y')
    expect(pack.pack.revisionStatus).toBe('approved')
  })

  it('18 lemas en orden del MD', () => {
    const pack = llyPack as OrtographyLemmaPack
    expect(pack.lemmas).toHaveLength(18)
    expect(pack.lemmas.map((l) => l.lemma)).toEqual([...EXPECTED_LEMMAS])
  })

  it('ids lly-* únicos, ruleId ll-y, errores válidos', () => {
    const pack = llyPack as OrtographyLemmaPack
    expect(new Set(pack.lemmas.map((l) => l.id)).size).toBe(18)
    expect(new Set(pack.lemmas.map((l) => l.lemma.toLocaleLowerCase('es'))).size).toBe(18)
    for (const item of pack.lemmas) {
      expect(item.id).toMatch(/^lly-/)
      expect(item.ruleId).toBe('ll-y')
      expect(item.errors.length).toBeGreaterThanOrEqual(1)
      for (const err of item.errors) {
        expect(err.toLocaleLowerCase('es')).not.toBe(item.lemma.toLocaleLowerCase('es'))
      }
      expect(['muy_frecuente', 'frecuente', 'poco_frecuente']).toContain(item.frequency)
    }
  })

  it('frecuencias 7 / 8 / 3', () => {
    const pack = llyPack as OrtographyLemmaPack
    const count = (f: string) => pack.lemmas.filter((l) => l.frequency === f).length
    expect(count('muy_frecuente')).toBe(7)
    expect(count('frecuente')).toBe(8)
    expect(count('poco_frecuente')).toBe(3)
  })

  it('no está en el catálogo jugable', () => {
    expect(listRegisteredFeinetas()).toEqual(['formar-palabras'])
  })
})
