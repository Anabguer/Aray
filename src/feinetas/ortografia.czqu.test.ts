import { describe, expect, it } from 'vitest'
import czquPack from '@feinetas/ortografia/czqu.json'
import {
  ORTOGRAPHY_SCHEMA_VERSION,
  assertValidOrtographyLemmaPack,
  validateOrtographyLemmaPack,
  type OrtographyLemmaPack,
} from '@/feinetas/ortographyLemmaPack'
import { listRegisteredFeinetas } from '@/feinetas/registry'

const EXPECTED_LEMMAS = [
  'queso',
  'zapato',
  'cocina',
  'zumo',
  'cielo',
  'lápiz',
  'ciudad',
  'cocodrilo',
  'cebolla',
  'pequeño',
  'macarrones',
  'azul',
  'cisne',
  'azúcar',
  'maceta',
  'receta',
  'paquete',
  'esquina',
  'cereza',
  'corazón',
  'ciervo',
  'cazo',
  'quince',
  'cebra',
  'erizo',
] as const

describe('feinetas / ortografia / czqu', () => {
  it('pasa schemaVersion 1', () => {
    expect(validateOrtographyLemmaPack(czquPack)).toEqual([])
    assertValidOrtographyLemmaPack(czquPack)
  })

  it('metadatos approved', () => {
    const pack = czquPack as OrtographyLemmaPack
    expect(pack.schemaVersion).toBe(ORTOGRAPHY_SCHEMA_VERSION)
    expect(pack.pack.id).toBe('ortografia-czqu')
    expect(pack.pack.ownerBank).toBe('ERRORES_REALES_CZQU.md')
    expect(pack.pack.ruleFamily).toBe('c-z-qu')
    expect(pack.pack.revisionStatus).toBe('approved')
    expect(pack.pack.contentVersion).toBeGreaterThanOrEqual(2)
  })

  it('conserva el núcleo C/Z/QU y añade lemas de fichas', () => {
    const pack = czquPack as OrtographyLemmaPack
    expect(pack.lemmas.length).toBeGreaterThanOrEqual(EXPECTED_LEMMAS.length)
    expect(EXPECTED_LEMMAS).toHaveLength(25)
    const lemmas = pack.lemmas.map((l) => l.lemma)
    expect(lemmas.slice(0, EXPECTED_LEMMAS.length)).toEqual([...EXPECTED_LEMMAS])
  })

  it('ids czqu-* únicos, ruleId c-z-qu, errores válidos', () => {
    const pack = czquPack as OrtographyLemmaPack
    expect(new Set(pack.lemmas.map((l) => l.id)).size).toBe(pack.lemmas.length)
    expect(new Set(pack.lemmas.map((l) => l.lemma.toLocaleLowerCase('es'))).size).toBe(
      pack.lemmas.length,
    )
    for (const item of pack.lemmas) {
      expect(item.id).toMatch(/^czqu-/)
      expect(item.ruleId).toBe('c-z-qu')
      expect(item.errors.length).toBeGreaterThanOrEqual(1)
      for (const err of item.errors) {
        expect(err.toLocaleLowerCase('es')).not.toBe(item.lemma.toLocaleLowerCase('es'))
      }
      expect(['muy_frecuente', 'frecuente', 'poco_frecuente']).toContain(item.frequency)
    }
  })

  it('ids con tilde sin colisión (lápiz, azúcar, corazón, pequeño)', () => {
    const pack = czquPack as OrtographyLemmaPack
    const by = Object.fromEntries(pack.lemmas.map((l) => [l.lemma, l.id]))
    expect(by['lápiz']).toBe('czqu-lapiz')
    expect(by['azúcar']).toBe('czqu-azucar')
    expect(by['corazón']).toBe('czqu-corazon')
    expect(by['pequeño']).toBe('czqu-pequeno')
  })

  it('frecuencias cubren las tres bandas', () => {
    const pack = czquPack as OrtographyLemmaPack
    const count = (f: string) => pack.lemmas.filter((l) => l.frequency === f).length
    expect(count('muy_frecuente')).toBeGreaterThanOrEqual(8)
    expect(count('frecuente')).toBeGreaterThanOrEqual(12)
    expect(count('poco_frecuente')).toBeGreaterThanOrEqual(5)
  })

  it('no está en el catálogo jugable', () => {
    expect(listRegisteredFeinetas()).toEqual(['formar-palabras'])
  })
})
