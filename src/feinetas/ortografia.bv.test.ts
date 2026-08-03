import { describe, expect, it } from 'vitest'
import bvPack from '@feinetas/ortografia/bv.json'
import {
  ORTOGRAPHY_SCHEMA_VERSION,
  assertValidOrtographyLemmaPack,
  validateOrtographyLemmaPack,
  type OrtographyLemmaPack,
} from '@/feinetas/ortographyLemmaPack'
import { listRegisteredFeinetas } from '@/feinetas/registry'

/** Orden exacto del MD congelado ERRORES_REALES_BV.md (31). */
const EXPECTED_LEMMAS = [
  'caballo',
  'vaca',
  'burro',
  'ventana',
  'abuelo',
  'abuela',
  'biblioteca',
  'barco',
  'botella',
  'llave',
  'libro',
  'verano',
  'invierno',
  'verde',
  'cebada',
  'escribir',
  'recibir',
  'subir',
  'vivir',
  'volver',
  'volar',
  'viaje',
  'valor',
  'pueblo',
  'viejo',
  'burbuja',
  'barro',
  'servicio',
  'recibo',
  'subida',
  'vivienda',
] as const

describe('feinetas / ortografia / bv (pack post-piloto)', () => {
  it('pasa la validación schemaVersion 1', () => {
    expect(validateOrtographyLemmaPack(bvPack)).toEqual([])
    assertValidOrtographyLemmaPack(bvPack)
  })

  it('tiene metadatos de pack B/V approved', () => {
    const pack = bvPack as OrtographyLemmaPack
    expect(pack.schemaVersion).toBe(ORTOGRAPHY_SCHEMA_VERSION)
    expect(pack.pack.id).toBe('ortografia-bv')
    expect(pack.pack.ownerBank).toBe('ERRORES_REALES_BV.md')
    expect(pack.pack.ruleFamily).toBe('b-v')
    expect(pack.pack.revisionStatus).toBe('approved')
    expect(pack.pack.contentVersion).toBeGreaterThanOrEqual(2)
  })

  it('conserva el núcleo B/V y añade lemas de fichas', () => {
    const pack = bvPack as OrtographyLemmaPack
    expect(pack.lemmas.length).toBeGreaterThanOrEqual(EXPECTED_LEMMAS.length)
    expect(EXPECTED_LEMMAS).toHaveLength(31)
    const lemmas = pack.lemmas.map((l) => l.lemma)
    expect(lemmas.slice(0, EXPECTED_LEMMAS.length)).toEqual([...EXPECTED_LEMMAS])
  })

  it('ids bv-* únicos, ruleId b-v, ≥1 error ≠ lema', () => {
    const pack = bvPack as OrtographyLemmaPack
    expect(new Set(pack.lemmas.map((l) => l.id)).size).toBe(pack.lemmas.length)
    expect(new Set(pack.lemmas.map((l) => l.lemma.toLocaleLowerCase('es'))).size).toBe(
      pack.lemmas.length,
    )
    for (const item of pack.lemmas) {
      expect(item.id).toMatch(/^bv-/)
      expect(item.ruleId).toBe('b-v')
      expect(item.errors.length).toBeGreaterThanOrEqual(1)
      expect(item.image.ref).toBeNull()
      for (const err of item.errors) {
        expect(err.toLocaleLowerCase('es')).not.toBe(item.lemma.toLocaleLowerCase('es'))
      }
      expect(['muy_frecuente', 'frecuente', 'poco_frecuente']).toContain(item.frequency)
      expect(item.category.length).toBeGreaterThan(0)
    }
  })

  it('ejemplos de ids estables (sin colisiones en BV)', () => {
    const pack = bvPack as OrtographyLemmaPack
    const byLemma = Object.fromEntries(pack.lemmas.map((l) => [l.lemma, l.id]))
    expect(byLemma.caballo).toBe('bv-caballo')
    expect(byLemma.invierno).toBe('bv-invierno')
    expect(byLemma.escribir).toBe('bv-escribir')
    expect(byLemma.viaje).toBe('bv-viaje')
  })

  it('frecuencias cubren las tres bandas', () => {
    const pack = bvPack as OrtographyLemmaPack
    const count = (f: string) => pack.lemmas.filter((l) => l.frequency === f).length
    expect(count('muy_frecuente')).toBeGreaterThanOrEqual(13)
    expect(count('frecuente')).toBeGreaterThanOrEqual(16)
    expect(count('poco_frecuente')).toBeGreaterThanOrEqual(2)
  })

  it('tip opcional no contiene el lema', () => {
    const pack = bvPack as OrtographyLemmaPack
    for (const item of pack.lemmas) {
      if (!item.tip) continue
      expect(item.tip.toLocaleLowerCase('es')).not.toContain(
        item.lemma.toLocaleLowerCase('es'),
      )
    }
  })

  it('no está en el catálogo jugable (juego no consume B/V)', () => {
    expect(listRegisteredFeinetas()).toEqual(['formar-palabras'])
  })
})
