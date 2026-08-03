import { describe, expect, it } from 'vitest'
import gjPack from '@feinetas/ortografia/gj.json'
import {
  ORTOGRAPHY_SCHEMA_VERSION,
  assertValidOrtographyLemmaPack,
  validateOrtographyLemmaPack,
  type OrtographyLemmaPack,
} from '@/feinetas/ortographyLemmaPack'
import { listRegisteredFeinetas } from '@/feinetas/registry'

/** Orden exacto del MD congelado ERRORES_REALES_GJ.md (31). */
const EXPECTED_LEMMAS = [
  'gente',
  'jirafa',
  'colegio',
  'juego',
  'jugar',
  'coger',
  'recoger',
  'elegir',
  'jersey',
  'girasol',
  'granja',
  'bruja',
  'ajedrez',
  'ágil',
  'lentejas',
  'lenguaje',
  'jugoso',
  'tejer',
  'mensaje',
  'viajero',
  'tijera',
  'traje',
  'gesto',
  'paisaje',
  'mensajero',
  'juicio',
  'jinete',
  'dirigir',
  'proteger',
  'general',
  'genio',
] as const

describe('feinetas / ortografia / gj (pack post-piloto)', () => {
  it('pasa la validación schemaVersion 1', () => {
    expect(validateOrtographyLemmaPack(gjPack)).toEqual([])
    assertValidOrtographyLemmaPack(gjPack)
  })

  it('tiene metadatos de pack G/J approved', () => {
    const pack = gjPack as OrtographyLemmaPack
    expect(pack.schemaVersion).toBe(ORTOGRAPHY_SCHEMA_VERSION)
    expect(pack.pack.id).toBe('ortografia-gj')
    expect(pack.pack.ownerBank).toBe('ERRORES_REALES_GJ.md')
    expect(pack.pack.ruleFamily).toBe('g-j')
    expect(pack.pack.revisionStatus).toBe('approved')
    expect(pack.pack.contentVersion).toBeGreaterThanOrEqual(2)
  })

  it('conserva el núcleo G/J y añade lemas de fichas', () => {
    const pack = gjPack as OrtographyLemmaPack
    expect(pack.lemmas.length).toBeGreaterThanOrEqual(EXPECTED_LEMMAS.length)
    expect(EXPECTED_LEMMAS).toHaveLength(31)
    const lemmas = pack.lemmas.map((l) => l.lemma)
    expect(lemmas.slice(0, EXPECTED_LEMMAS.length)).toEqual([...EXPECTED_LEMMAS])
  })

  it('ids gj-* únicos, ruleId g-j, ≥1 error ≠ lema', () => {
    const pack = gjPack as OrtographyLemmaPack
    expect(new Set(pack.lemmas.map((l) => l.id)).size).toBe(pack.lemmas.length)
    expect(new Set(pack.lemmas.map((l) => l.lemma.toLocaleLowerCase('es'))).size).toBe(
      pack.lemmas.length,
    )
    for (const item of pack.lemmas) {
      expect(item.id).toMatch(/^gj-/)
      expect(item.ruleId).toBe('g-j')
      expect(item.errors.length).toBeGreaterThanOrEqual(1)
      expect(item.image.ref).toBeNull()
      for (const err of item.errors) {
        expect(err.toLocaleLowerCase('es')).not.toBe(item.lemma.toLocaleLowerCase('es'))
      }
      expect(['muy_frecuente', 'frecuente', 'poco_frecuente']).toContain(item.frequency)
      expect(item.category.length).toBeGreaterThan(0)
    }
  })

  it('ids estables sin colisiones (ágil → gj-agil)', () => {
    const pack = gjPack as OrtographyLemmaPack
    const byLemma = Object.fromEntries(pack.lemmas.map((l) => [l.lemma, l.id]))
    expect(byLemma.gente).toBe('gj-gente')
    expect(byLemma.jirafa).toBe('gj-jirafa')
    expect(byLemma.ágil).toBe('gj-agil')
    expect(byLemma.proteger).toBe('gj-proteger')
    expect(byLemma.viajero).toBe('gj-viajero')
  })

  it('frecuencias cubren las tres bandas', () => {
    const pack = gjPack as OrtographyLemmaPack
    const count = (f: string) => pack.lemmas.filter((l) => l.frequency === f).length
    expect(count('muy_frecuente')).toBeGreaterThanOrEqual(10)
    expect(count('frecuente')).toBeGreaterThanOrEqual(13)
    expect(count('poco_frecuente')).toBeGreaterThanOrEqual(8)
  })

  it('tip opcional no contiene el lema', () => {
    const pack = gjPack as OrtographyLemmaPack
    for (const item of pack.lemmas) {
      if (!item.tip) continue
      expect(item.tip.toLocaleLowerCase('es')).not.toContain(
        item.lemma.toLocaleLowerCase('es'),
      )
    }
  })

  it('no está en el catálogo jugable (juego no consume G/J)', () => {
    expect(listRegisteredFeinetas()).toEqual(['formar-palabras'])
  })
})
