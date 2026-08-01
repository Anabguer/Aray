import { describe, expect, it } from 'vitest'
import rrPack from '@feinetas/ortografia/rr.json'
import {
  ORTOGRAPHY_SCHEMA_VERSION,
  assertValidOrtographyLemmaPack,
  validateOrtographyLemmaPack,
  type OrtographyLemmaPack,
} from '@/feinetas/ortographyLemmaPack'

/** Lemas esperados del MD congelado ERRORES_REALES_RR.md (orden editorial). */
const EXPECTED_LEMMAS = [
  'perro',
  'carro',
  'correr',
  'carrera',
  'alrededor',
  'tierra',
  'gorro',
  'arroz',
  'carretera',
  'oreja',
  'marrón',
  'cerrado',
  'terreno',
  'arriba',
  'sonrisa',
  'parar',
  'barrer',
  'enredar',
  'arrancar',
  'correcto',
  'borrón',
] as const

describe('feinetas / ortografia / rr (pack piloto)', () => {
  it('pasa la validación schemaVersion 1', () => {
    const issues = validateOrtographyLemmaPack(rrPack)
    expect(issues).toEqual([])
    assertValidOrtographyLemmaPack(rrPack)
  })

  it('tiene metadatos de pack piloto RR', () => {
    const pack = rrPack as OrtographyLemmaPack
    expect(pack.schemaVersion).toBe(ORTOGRAPHY_SCHEMA_VERSION)
    expect(pack.pack.id).toBe('ortografia-rr')
    expect(pack.pack.ownerBank).toBe('ERRORES_REALES_RR.md')
    expect(pack.pack.ruleFamily).toBe('r-rr')
    expect(pack.pack.revisionStatus).toBe('draft')
    expect(pack.pack.contentVersion).toBe(1)
    expect(pack.pack.level).toBe('3-primaria')
    expect(pack.pack.locale).toBe('es-ES')
  })

  it('contiene exactamente los 21 lemas del banco RR congelado', () => {
    const pack = rrPack as OrtographyLemmaPack
    expect(pack.lemmas).toHaveLength(21)
    expect(pack.lemmas.map((l) => l.lemma)).toEqual([...EXPECTED_LEMMAS])
  })

  it('ids estables únicos y ruleId propietario r-rr', () => {
    const pack = rrPack as OrtographyLemmaPack
    const ids = pack.lemmas.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const item of pack.lemmas) {
      expect(item.id).toMatch(/^rr-/)
      expect(item.ruleId).toBe('r-rr')
      expect(item.errors.length).toBeGreaterThanOrEqual(1)
      expect(item.image.ref).toBeNull()
    }
  })

  it('respeta tip opcional sin filtrar el lema', () => {
    const pack = rrPack as OrtographyLemmaPack
    for (const item of pack.lemmas) {
      if (item.tip === undefined) continue
      expect(item.tip.length).toBeGreaterThan(0)
      expect(item.tip.toLocaleLowerCase('es')).not.toContain(
        item.lemma.toLocaleLowerCase('es'),
      )
    }
  })

  it('marca tildes solo como cruce (sin duplicar lema)', () => {
    const pack = rrPack as OrtographyLemmaPack
    const marron = pack.lemmas.find((l) => l.lemma === 'marrón')
    const borron = pack.lemmas.find((l) => l.lemma === 'borrón')
    expect(marron?.tags).toContain('tilde')
    expect(marron?.secondaryRuleIds).toEqual(['tilde'])
    expect(borron?.tags).toContain('tilde')
    expect(borron?.secondaryRuleIds).toEqual(['tilde'])
  })

  it('distribuye frecuencias 8 / 9 / 4 como el MD', () => {
    const pack = rrPack as OrtographyLemmaPack
    const count = (f: string) => pack.lemmas.filter((l) => l.frequency === f).length
    expect(count('muy_frecuente')).toBe(8)
    expect(count('frecuente')).toBe(9)
    expect(count('poco_frecuente')).toBe(4)
  })

  it('alrededor conserva los dos errores editoriales', () => {
    const pack = rrPack as OrtographyLemmaPack
    const item = pack.lemmas.find((l) => l.lemma === 'alrededor')
    expect(item?.errors).toEqual(['alrrededor', 'arrededor'])
  })
})
