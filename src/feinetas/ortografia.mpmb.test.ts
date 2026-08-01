import { describe, expect, it } from 'vitest'
import mpmbPack from '@feinetas/ortografia/mpmb.json'
import {
  ORTOGRAPHY_SCHEMA_VERSION,
  assertValidOrtographyLemmaPack,
  validateOrtographyLemmaPack,
  type OrtographyLemmaPack,
} from '@/feinetas/ortographyLemmaPack'
import { listRegisteredFeinetas } from '@/feinetas/registry'

const EXPECTED_LEMMAS = [
  'también',
  'siempre',
  'campo',
  'tiempo',
  'comprar',
  'cambiar',
  'compañero',
  'enviar',
  'tambor',
  'campeón',
  'envase',
  'noviembre',
  'campamento',
  'bombero',
  'empanada',
  'sombrero',
  'embudo',
  'lombriz',
] as const

describe('feinetas / ortografia / mpmb', () => {
  it('pasa schemaVersion 1', () => {
    expect(validateOrtographyLemmaPack(mpmbPack)).toEqual([])
    assertValidOrtographyLemmaPack(mpmbPack)
  })

  it('metadatos approved', () => {
    const pack = mpmbPack as OrtographyLemmaPack
    expect(pack.schemaVersion).toBe(ORTOGRAPHY_SCHEMA_VERSION)
    expect(pack.pack.id).toBe('ortografia-mpmb')
    expect(pack.pack.ownerBank).toBe('ERRORES_REALES_MPMB.md')
    expect(pack.pack.ruleFamily).toBe('mb-mp-nv')
    expect(pack.pack.revisionStatus).toBe('approved')
  })

  it('18 lemas en orden del MD', () => {
    const pack = mpmbPack as OrtographyLemmaPack
    expect(pack.lemmas).toHaveLength(18)
    expect(pack.lemmas.map((l) => l.lemma)).toEqual([...EXPECTED_LEMMAS])
  })

  it('ids mpmb-* únicos, ruleId mb-mp-nv, errores válidos', () => {
    const pack = mpmbPack as OrtographyLemmaPack
    expect(new Set(pack.lemmas.map((l) => l.id)).size).toBe(18)
    expect(new Set(pack.lemmas.map((l) => l.lemma.toLocaleLowerCase('es'))).size).toBe(18)
    for (const item of pack.lemmas) {
      expect(item.id).toMatch(/^mpmb-/)
      expect(item.ruleId).toBe('mb-mp-nv')
      expect(item.errors.length).toBeGreaterThanOrEqual(1)
      for (const err of item.errors) {
        expect(err.toLocaleLowerCase('es')).not.toBe(item.lemma.toLocaleLowerCase('es'))
      }
      expect(['muy_frecuente', 'frecuente', 'poco_frecuente']).toContain(item.frequency)
    }
  })

  it('ids con tilde sin colisión (también, campeón)', () => {
    const pack = mpmbPack as OrtographyLemmaPack
    const by = Object.fromEntries(pack.lemmas.map((l) => [l.lemma, l.id]))
    expect(by['también']).toBe('mpmb-tambien')
    expect(by['campeón']).toBe('mpmb-campeon')
    expect(by.tambor).toBe('mpmb-tambor')
  })

  it('frecuencias 8 / 8 / 2', () => {
    const pack = mpmbPack as OrtographyLemmaPack
    const count = (f: string) => pack.lemmas.filter((l) => l.frequency === f).length
    expect(count('muy_frecuente')).toBe(8)
    expect(count('frecuente')).toBe(8)
    expect(count('poco_frecuente')).toBe(2)
  })

  it('no está en el catálogo jugable', () => {
    expect(listRegisteredFeinetas()).toEqual(['formar-palabras'])
  })
})
