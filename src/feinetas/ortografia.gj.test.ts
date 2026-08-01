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
    expect(pack.pack.contentVersion).toBe(1)
  })

  it('contiene exactamente los 31 lemas del MD en el mismo orden', () => {
    const pack = gjPack as OrtographyLemmaPack
    expect(pack.lemmas).toHaveLength(31)
    expect(EXPECTED_LEMMAS).toHaveLength(31)
    expect(pack.lemmas.map((l) => l.lemma)).toEqual([...EXPECTED_LEMMAS])
  })

  it('ids gj-* únicos, ruleId g-j, ≥1 error ≠ lema', () => {
    const pack = gjPack as OrtographyLemmaPack
    expect(new Set(pack.lemmas.map((l) => l.id)).size).toBe(31)
    expect(new Set(pack.lemmas.map((l) => l.lemma.toLocaleLowerCase('es'))).size).toBe(31)
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

  it('frecuencias 10 / 13 / 8 como el MD', () => {
    const pack = gjPack as OrtographyLemmaPack
    const count = (f: string) => pack.lemmas.filter((l) => l.frequency === f).length
    expect(count('muy_frecuente')).toBe(10)
    expect(count('frecuente')).toBe(13)
    expect(count('poco_frecuente')).toBe(8)
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
