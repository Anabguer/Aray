import { describe, expect, it } from 'vitest'
import packJson from '@feinetas/ortografia/hay-ahi-ay.json'
import {
  assertValidOrtographyLemmaPack,
  validateOrtographyLemmaPack,
  type OrtographyLemmaPack,
} from '@/feinetas/ortographyLemmaPack'
import { listRegisteredFeinetas } from '@/feinetas/registry'

const EXPECTED = ['hay', 'ahí', 'ay'] as const

describe('feinetas / ortografia / hay-ahi-ay', () => {
  it('valida schema y metadatos approved', () => {
    expect(validateOrtographyLemmaPack(packJson)).toEqual([])
    assertValidOrtographyLemmaPack(packJson)
    const pack = packJson as OrtographyLemmaPack
    expect(pack.pack.id).toBe('ortografia-hay-ahi-ay')
    expect(pack.pack.revisionStatus).toBe('approved')
    expect(pack.pack.ruleFamily).toBe('hay-ahi-ay')
  })

  it('tiene exactamente la tríada en orden editorial', () => {
    const pack = packJson as OrtographyLemmaPack
    expect(pack.lemmas.map((l) => l.lemma)).toEqual([...EXPECTED])
    expect(new Set(pack.lemmas.map((l) => l.id)).size).toBe(3)
  })

  it('no está en el catálogo jugable', () => {
    expect(listRegisteredFeinetas()).toEqual(['formar-palabras'])
  })
})
