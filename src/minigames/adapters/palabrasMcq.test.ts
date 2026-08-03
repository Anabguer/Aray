import { describe, expect, it } from 'vitest'
import {
  buildPalabrasMcqRound,
  PALABRAS_MCQ_ROUND_SIZE,
} from '@/minigames/adapters/palabrasMcq'
import { listMorphItems, listSemanticItems } from '@/feinetas/wordsBanks'

describe('palabrasMcq adapters', () => {
  it('banco morph tiene stock para ambos ejes', () => {
    expect(listMorphItems('number').length).toBeGreaterThanOrEqual(PALABRAS_MCQ_ROUND_SIZE)
    expect(listMorphItems('gender').length).toBeGreaterThanOrEqual(PALABRAS_MCQ_ROUND_SIZE)
  })

  it('banco semantic tiene stock para synonym y antonym', () => {
    expect(listSemanticItems('synonym').length).toBeGreaterThanOrEqual(PALABRAS_MCQ_ROUND_SIZE)
    expect(listSemanticItems('antonym').length).toBeGreaterThanOrEqual(PALABRAS_MCQ_ROUND_SIZE)
  })

  it.each([
    'singular-plural',
    'masculino-femenino',
    'sinonimos',
    'antonimos',
  ] as const)('buildPalabrasMcqRound(%s) genera ronda válida', (productId) => {
    const round = buildPalabrasMcqRound(productId, PALABRAS_MCQ_ROUND_SIZE, 42)
    expect(round).toHaveLength(PALABRAS_MCQ_ROUND_SIZE)
    for (const q of round) {
      expect(q.prompt.length).toBeGreaterThan(0)
      expect(q.options.length).toBeGreaterThanOrEqual(2)
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(q.options.length)
      const correct = q.options[q.correctIndex]!
      expect(correct.trim().length).toBeGreaterThan(0)
      const norms = q.options.map((o) => o.toLocaleLowerCase('es'))
      expect(new Set(norms).size).toBe(norms.length)
    }
  })

  it('morph sin distractores usa el par (2 opciones)', () => {
    const round = buildPalabrasMcqRound('singular-plural', 8, 7)
    const twoOpt = round.filter((q) => q.options.length === 2)
    expect(twoOpt.length).toBeGreaterThan(0)
  })
})
