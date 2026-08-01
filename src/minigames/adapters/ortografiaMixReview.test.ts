import { describe, expect, it } from 'vitest'
import { buildOrtografiaMixRound } from '@/minigames/adapters/ortografiaMix'
import { buildOrtografiaReviewRound } from '@/minigames/adapters/ortografiaReview'
import { buildRound } from '@/minigames/buildRound'
import { getMinigame } from '@/minigames/catalog'
import { parseOrtographyMissKey } from '@/feinetas/ortographyCorpus'
import { isLegacyCompleteMissKey } from '@/spelling/legacyComplete'
import type { SpellMissEntry } from '@/spelling/missStore'

describe('ortografiaMix', () => {
  it('solo targetKey JSON o ctx:; sin palabras sueltas del bank', () => {
    const round = buildOrtografiaMixRound(24, 77_001)
    expect(round).toHaveLength(24)
    let ctx = 0
    let json = 0
    for (const q of round) {
      const key = q.targetKey ?? ''
      if (isLegacyCompleteMissKey(key)) {
        ctx += 1
        expect(q.display).toBeTruthy()
      } else {
        json += 1
        expect(parseOrtographyMissKey(key)).not.toBeNull()
      }
    }
    expect(ctx).toBeGreaterThan(0)
    expect(json).toBeGreaterThan(0)
  })

  it('catalog mix es pack', () => {
    expect(getMinigame('spelling-mix').source).toBe('pack')
    const r = buildRound('spelling-mix', { count: 6, seed: 9 })
    expect(r.kind).toBe('spell-mcq')
  })
})

describe('ortografiaReview', () => {
  it('repite fallos JSON y ctx por pipelines separados', () => {
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
        key: 'ctx:hay-1',
        rule: 'hay-ahi-ay',
        misses: 1,
        hits: 0,
        streakHits: 0,
        updatedAt: Date.now(),
      },
    ]
    const round = buildOrtografiaReviewRound(4, 88_001, misses)
    expect(round[0]?.targetKey).toBe('ortografia-rr:rr-perro')
    expect(round[1]?.targetKey).toBe('ctx:hay-1')
  })

  it('ignora claves huérfanas del bank (palabra suelta)', () => {
    const misses: SpellMissEntry[] = [
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
    expect(round.every((q) => q.targetKey !== 'perro')).toBe(true)
    expect(
      round.every(
        (q) =>
          isLegacyCompleteMissKey(q.targetKey ?? '') ||
          parseOrtographyMissKey(q.targetKey ?? '') != null,
      ),
    ).toBe(true)
  })
})
