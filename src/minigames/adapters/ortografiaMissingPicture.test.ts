import { describe, expect, it } from 'vitest'
import { getOrtographyCorpus } from '@/feinetas/ortographyCorpus'
import {
  buildOrtografiaMissingQuestion,
  buildOrtografiaMissingRound,
  diffHardUnit,
} from '@/minigames/adapters/ortografiaMissing'
import { PICTURE_MODE_ENABLED, buildOrtografiaPictureRound } from '@/minigames/adapters/ortografiaPicture'
import { buildRound } from '@/minigames/buildRound'
import { getMinigame } from '@/minigames/catalog'

describe('ortografiaMissing', () => {
  it('genera huecos con opciones rivales (2–N, sin fillers)', () => {
    const round = buildOrtografiaMissingRound(8, 55_001)
    expect(round).toHaveLength(8)
    for (const q of round) {
      expect(q.options.length).toBeGreaterThanOrEqual(2)
      expect(q.options.length).toBeLessThanOrEqual(4)
      expect(q.display).toContain('_')
      expect(q.display).not.toContain('·')
      expect(q.targetKey?.startsWith('ortografia-')).toBe(true)
    }
  })

  it('detecta omisión de h (hierro) e inserción espuria (echar)', () => {
    expect(diffHardUnit('hierro', 'ierro')).toEqual({ index: 0, unit: 'h' })
    expect(diffHardUnit('echar', 'hechar')).toEqual({ index: 0, unit: '' })
    expect(diffHardUnit('ola', 'hola')).toEqual({ index: 0, unit: '' })
    expect(diffHardUnit('ahora', 'aora')).toEqual({ index: 1, unit: 'h' })
  })

  it('en palabras sin hache la respuesta correcta es el hueco vacío', () => {
    const echar = getOrtographyCorpus().entries.find((e) => e.lemma.lemma === 'echar')
    expect(echar).toBeTruthy()
    const q = buildOrtografiaMissingQuestion(42, new Set(), 'missing', echar)
    expect(q.display).toBe('_echar')
    expect(q.options).toContain('')
    expect(q.options).toContain('h')
    expect(q.options[q.correctIndex]).toBe('')
  })
})

describe('ortografiaPicture', () => {
  it('está desactivado sin image.ref reales', () => {
    expect(PICTURE_MODE_ENABLED).toBe(false)
    expect(getOrtographyCorpus().entries.every((e) => !e.lemma.image.ref)).toBe(true)
    expect(() => buildOrtografiaPictureRound(4, 1)).toThrow(/desactivado/)
  })
})

describe('cableado missing/picture', () => {
  it('missing activo; picture coming-soon y buildRound lanza', () => {
    expect(getMinigame('spelling-missing').source).toBe('pack')
    expect(getMinigame('spelling-picture').status).toBe('coming-soon')
    const m = buildRound('spelling-missing', { count: 4, seed: 1 })
    expect(m.kind).toBe('spell-mcq')
    expect(() => buildRound('spelling-picture', { count: 4, seed: 1 })).toThrow(/Imagen desactivado/)
  })
})
