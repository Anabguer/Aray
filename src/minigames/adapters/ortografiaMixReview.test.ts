import { describe, expect, it } from 'vitest'
import { buildOrtografiaMixRound } from '@/minigames/adapters/ortografiaMix'
import { buildOrtografiaReviewRound } from '@/minigames/adapters/ortografiaReview'
import { buildRound } from '@/minigames/buildRound'
import { getMinigame } from '@/minigames/catalog'
import { parseOrtographyMissKey } from '@/feinetas/ortographyCorpus'
import { isOrtographyPhraseMissKey } from '@/minigames/adapters/ortografiaComplete'
import { isLegacyCompleteMissKey } from '@/spelling/missStore'
import type { SpellMissEntry } from '@/spelling/missStore'

describe('ortografiaMix', () => {
  it('solo targetKey JSON de lemas o de frases', () => {
    const round = buildOrtografiaMixRound(24, 77_001)
    expect(round).toHaveLength(24)
    let frases = 0
    let lemmas = 0
    for (const q of round) {
      const key = q.targetKey ?? ''
      expect(isLegacyCompleteMissKey(key)).toBe(false)
      if (isOrtographyPhraseMissKey(key)) {
        frases += 1
        expect(q.display).toContain('___')
      } else {
        lemmas += 1
        expect(parseOrtographyMissKey(key)).not.toBeNull()
      }
    }
    expect(frases).toBeGreaterThan(0)
    expect(lemmas).toBeGreaterThan(0)
  })

  it('catalog mix es pack', () => {
    expect(getMinigame('spelling-mix').source).toBe('pack')
    const r = buildRound('spelling-mix', { count: 6, seed: 9 })
    expect(r.kind).toBe('spell-mcq')
  })
})

describe('ortografiaReview', () => {
  it('repite fallos de lema y de frase', () => {
    const misses: SpellMissEntry[] = [
      {
        key: 'ortografia-rr:rr-perro',
        rule: 'r-rr',
        misses: 2,
        hits: 0,
        streakHits: 0,
        updatedAt: Date.now(),
      },
      {
        key: 'ortografia-frases-completar:frase-hay-01',
        rule: 'hay-ahi-ay',
        misses: 1,
        hits: 0,
        streakHits: 0,
        updatedAt: Date.now(),
      },
    ]
    const round = buildOrtografiaReviewRound(4, 88_001, misses)
    expect(round[0]?.targetKey).toBe('ortografia-rr:rr-perro')
    expect(round[1]?.targetKey).toBe('ortografia-frases-completar:frase-hay-01')
  })

  it('ignora claves ctx legacy y palabras sueltas', () => {
    const misses: SpellMissEntry[] = [
      {
        key: 'ctx:hay-1',
        rule: 'hay-ahi-ay',
        misses: 5,
        hits: 0,
        streakHits: 0,
        updatedAt: Date.now(),
      },
      {
        key: 'perro',
        rule: 'r-rr',
        misses: 5,
        hits: 0,
        streakHits: 0,
        updatedAt: Date.now(),
      },
    ]
    const round = buildOrtografiaReviewRound(3, 11_001, misses)
    expect(round.every((q) => !q.targetKey?.startsWith('ctx:'))).toBe(true)
    expect(round.every((q) => q.targetKey !== 'perro')).toBe(true)
  })
})
