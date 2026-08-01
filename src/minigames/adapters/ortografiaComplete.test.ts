import { describe, expect, it } from 'vitest'
import {
  assertValidOrtographyPhrasesPack,
  validateOrtographyPhrasesPack,
} from '@/feinetas/ortographyPhrasesPack'
import frases from '@feinetas/ortografia/frases-completar.json'
import {
  buildOrtografiaCompleteRound,
  getOrtographyPhrasesPack,
  listActivePhraseItems,
  phraseMissKey,
} from '@/minigames/adapters/ortografiaComplete'
import { buildRound } from '@/minigames/buildRound'
import { getMinigame } from '@/minigames/catalog'

describe('frases-completar pack', () => {
  it('valida y tiene 24–30 ítems approved', () => {
    expect(validateOrtographyPhrasesPack(frases)).toEqual([])
    assertValidOrtographyPhrasesPack(frases)
    const n = listActivePhraseItems().length
    expect(n).toBeGreaterThanOrEqual(24)
    expect(n).toBeLessThanOrEqual(30)
    expect(getOrtographyPhrasesPack().pack.revisionStatus).toBe('approved')
  })

  it('cada ítem tiene 4 opciones y hueco', () => {
    for (const item of listActivePhraseItems()) {
      expect(item.sentence).toContain('___')
      expect(item.options).toHaveLength(4)
      expect(item.options[item.correctIndex]).toBeTruthy()
      const lower = item.options.map((o) => o.toLocaleLowerCase('es'))
      expect(new Set(lower).size).toBe(4)
      expect(lower.includes('ay') && item.options.some((o) => /¡\s*ay\s*!/i.test(o))).toBe(
        false,
      )
    }
  })

  it('buildRound(spelling-complete) usa pack de frases', () => {
    const game = getMinigame('spelling-complete')
    expect(game.source).toBe('pack')
    expect(game.packIds).toEqual(['ortografia-frases-completar'])
    const round = buildOrtografiaCompleteRound(8, 42)
    expect(round).toHaveLength(8)
    for (const q of round) {
      expect(q.display).toContain('___')
      expect(q.targetKey?.startsWith('ortografia-frases-completar:')).toBe(true)
      expect(q.options).toHaveLength(4)
    }
    const via = buildRound('spelling-complete', { count: 6, seed: 9 })
    expect(via.kind).toBe('spell-mcq')
    if (via.kind !== 'spell-mcq') return
    expect(via.questions.every((q) => q.targetKey?.includes('frase-'))).toBe(true)
  })

  it('miss key estable', () => {
    expect(phraseMissKey('frase-hay-01')).toBe(
      'ortografia-frases-completar:frase-hay-01',
    )
  })
})
