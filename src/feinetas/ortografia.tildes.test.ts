import { describe, expect, it } from 'vitest'
import packJson from '@feinetas/ortografia/tildes.json'
import {
  assertValidOrtographyLemmaPack,
  validateOrtographyLemmaPack,
  type OrtographyLemmaPack,
} from '@/feinetas/ortographyLemmaPack'
import { listRegisteredFeinetas } from '@/feinetas/registry'

const EXPECTED = [
  'colchón',
  'plátano',
  'árbol',
  'autobús',
  'camión',
  'sábado',
  'máquina',
  'médico',
  'brócoli',
  'melocotón',
  'préstamos',
] as const

describe('feinetas / ortografia / tildes', () => {
  it('valida schema y metadatos approved', () => {
    expect(validateOrtographyLemmaPack(packJson)).toEqual([])
    assertValidOrtographyLemmaPack(packJson)
    const pack = packJson as OrtographyLemmaPack
    expect(pack.pack.id).toBe('ortografia-tildes')
    expect(pack.pack.revisionStatus).toBe('approved')
    expect(pack.pack.ruleFamily).toBe('tilde')
  })

  it('11 lemas en orden del MD (sin lápiz/corazón/también)', () => {
    const pack = packJson as OrtographyLemmaPack
    expect(pack.lemmas.map((l) => l.lemma)).toEqual([...EXPECTED])
    expect(new Set(pack.lemmas.map((l) => l.id)).size).toBe(11)
  })

  it('errores = forma sin tilde', () => {
    const pack = packJson as OrtographyLemmaPack
    for (const item of pack.lemmas) {
      expect(item.ruleId).toBe('tilde')
      expect(item.errors.length).toBeGreaterThanOrEqual(1)
      expect(item.errors[0]!.toLocaleLowerCase('es')).not.toBe(
        item.lemma.toLocaleLowerCase('es'),
      )
    }
  })

  it('no está en el catálogo jugable', () => {
    expect(listRegisteredFeinetas()).toEqual(['formar-palabras'])
  })
})
