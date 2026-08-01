import { describe, expect, it } from 'vitest'
import { diffHardUnit, buildOrtografiaMissingRound } from '@/minigames/adapters/ortografiaMissing'
import { buildOrtografiaPictureRound } from '@/minigames/adapters/ortografiaPicture'
import { getOrtographyCorpus } from '@/feinetas/ortographyCorpus'
import { buildRound } from '@/minigames/buildRound'
import { getMinigame } from '@/minigames/catalog'

describe('ortografiaMissing', () => {
  it('diffHardUnit detecta rr vs r', () => {
    expect(diffHardUnit('perro', 'pero')).toEqual({ index: 2, unit: 'rr' })
  })

  it('incluye display con hueco', () => {
    const round = buildOrtografiaMissingRound(8, 12_001)
    for (const q of round) {
      expect(q.display).toBeTruthy()
      expect(q.display).toContain('·')
      expect(q.options).toHaveLength(4)
      expect(q.targetKey?.startsWith('ortografia-')).toBe(true)
    }
  })
})

describe('ortografiaPicture', () => {
  it('solo usa lemas con image.recommended (o fallback corpus)', () => {
    const recommended = new Set(
      getOrtographyCorpus().pictureEntries.map((e) => `${e.packId}:${e.lemma.id}`),
    )
    expect(recommended.size).toBeGreaterThan(50)
    const round = buildOrtografiaPictureRound(8, 22_001)
    for (const q of round) {
      expect(q.emoji).toBeTruthy()
      expect(q.prompt).toBe('¿Cómo se escribe?')
      expect(recommended.has(q.targetKey!)).toBe(true)
    }
  })
})

describe('cableado missing/picture', () => {
  it('catalog pack source', () => {
    expect(getMinigame('spelling-missing').source).toBe('pack')
    expect(getMinigame('spelling-picture').source).toBe('pack')
    const m = buildRound('spelling-missing', { count: 4, seed: 1 })
    const p = buildRound('spelling-picture', { count: 4, seed: 1 })
    expect(m.kind).toBe('spell-mcq')
    expect(p.kind).toBe('spell-mcq')
  })
})
