import { describe, expect, it } from 'vitest'
import hPack from '@feinetas/ortografia/h.json'
import {
  ORTOGRAPHY_SCHEMA_VERSION,
  assertValidOrtographyLemmaPack,
  validateOrtographyLemmaPack,
  type OrtographyLemmaPack,
} from '@/feinetas/ortographyLemmaPack'
import { listRegisteredFeinetas } from '@/feinetas/registry'

/** Orden exacto del MD congelado ERRORES_REALES_H.md (51). */
const EXPECTED_LEMMAS = [
  'hierba',
  'hielo',
  'hueco',
  'hueso',
  'hierro',
  'huevo',
  'huir',
  'hacer',
  'hace',
  'hizo',
  'hice',
  'hacía',
  'hecho',
  'echar',
  'echa',
  'echo',
  'hablar',
  'haber',
  'ha',
  'he',
  'hemos',
  'han',
  'había',
  'hubo',
  'hora',
  'horas',
  'hoy',
  'ahora',
  'hasta',
  'hola',
  'ola',
  'asta',
  'hijo',
  'hija',
  'hermano',
  'hermana',
  'hombre',
  'hogar',
  'hambre',
  'higo',
  'helado',
  'hormiga',
  'hormiguero',
  'hombro',
  'hospital',
  'herramienta',
  'hoja',
  'horno',
  'hacia',
  'historia',
  'zanahoria',
] as const

describe('feinetas / ortografia / h (pack post-piloto)', () => {
  it('pasa la validación schemaVersion 1', () => {
    const issues = validateOrtographyLemmaPack(hPack)
    expect(issues).toEqual([])
    assertValidOrtographyLemmaPack(hPack)
  })

  it('tiene metadatos de pack H approved', () => {
    const pack = hPack as OrtographyLemmaPack
    expect(pack.schemaVersion).toBe(ORTOGRAPHY_SCHEMA_VERSION)
    expect(pack.pack.id).toBe('ortografia-h')
    expect(pack.pack.ownerBank).toBe('ERRORES_REALES_H.md')
    expect(pack.pack.ruleFamily).toBe('h')
    expect(pack.pack.revisionStatus).toBe('approved')
    expect(pack.pack.contentVersion).toBe(2)
    expect(pack.pack.level).toBe('3-primaria')
    expect(pack.pack.locale).toBe('es-ES')
  })

  it('contiene exactamente los 51 lemas del MD en el mismo orden', () => {
    const pack = hPack as OrtographyLemmaPack
    expect(pack.lemmas).toHaveLength(51)
    expect(EXPECTED_LEMMAS).toHaveLength(51)
    expect(pack.lemmas.map((l) => l.lemma)).toEqual([...EXPECTED_LEMMAS])
  })

  it('ids estables únicos, ruleId h, ≥1 error ≠ lema', () => {
    const pack = hPack as OrtographyLemmaPack
    const ids = pack.lemmas.map((l) => l.id)
    const lemmas = pack.lemmas.map((l) => l.lemma.toLocaleLowerCase('es'))
    expect(new Set(ids).size).toBe(51)
    expect(new Set(lemmas).size).toBe(51)
    for (const item of pack.lemmas) {
      expect(item.id).toMatch(/^h-/)
      expect(item.ruleId).toBe('h')
      expect(item.errors.length).toBeGreaterThanOrEqual(1)
      expect(item.image.ref).toBeNull()
      for (const err of item.errors) {
        expect(err.toLocaleLowerCase('es')).not.toBe(item.lemma.toLocaleLowerCase('es'))
      }
      expect(['muy_frecuente', 'frecuente', 'poco_frecuente']).toContain(item.frequency)
      expect(typeof item.category).toBe('string')
      expect(item.category.length).toBeGreaterThan(0)
    }
  })

  it('distingue hacía vs hacia en ids legibles', () => {
    const pack = hPack as OrtographyLemmaPack
    const haciaTilde = pack.lemmas.find((l) => l.lemma === 'hacía')
    const hacia = pack.lemmas.find((l) => l.lemma === 'hacia')
    expect(haciaTilde?.id).toBe('h-hacia-tilde')
    expect(hacia?.id).toBe('h-hacia')
    expect(haciaTilde?.id).not.toBe(hacia?.id)
  })

  it('ejemplos de ids estables legibles', () => {
    const pack = hPack as OrtographyLemmaPack
    const byLemma = Object.fromEntries(pack.lemmas.map((l) => [l.lemma, l.id]))
    expect(byLemma.hacer).toBe('h-hacer')
    expect(byLemma.hielo).toBe('h-hielo')
    expect(byLemma.hueso).toBe('h-hueso')
  })

  it('frecuencias 19 / 22 / 10 como el MD post-normalización', () => {
    const pack = hPack as OrtographyLemmaPack
    const count = (f: string) => pack.lemmas.filter((l) => l.frequency === f).length
    expect(count('muy_frecuente')).toBe(19)
    expect(count('frecuente')).toBe(22)
    expect(count('poco_frecuente')).toBe(10)
  })

  it('tip opcional no contiene el lema', () => {
    const pack = hPack as OrtographyLemmaPack
    for (const item of pack.lemmas) {
      if (item.tip === undefined) continue
      expect(item.tip.length).toBeGreaterThan(0)
      expect(item.tip.toLocaleLowerCase('es')).not.toContain(
        item.lemma.toLocaleLowerCase('es'),
      )
    }
  })

  it('no está registrado en el catálogo jugable de feinetas (juego no consume H)', () => {
    expect(listRegisteredFeinetas()).not.toContain('h' as never)
    expect(listRegisteredFeinetas()).toEqual(['formar-palabras'])
  })
})
