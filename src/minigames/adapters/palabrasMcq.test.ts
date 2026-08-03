import { describe, expect, it } from 'vitest'
import {
  buildPalabrasMcqRound,
  PALABRAS_MCQ_ROUND_SIZE,
} from '@/minigames/adapters/palabrasMcq'
import { listSemanticItems } from '@/feinetas/wordsBanks'

describe('palabrasMcq adapters', () => {
  it('banco semantic tiene stock para synonym y antonym', () => {
    expect(listSemanticItems('synonym').length).toBeGreaterThanOrEqual(PALABRAS_MCQ_ROUND_SIZE)
    expect(listSemanticItems('antonym').length).toBeGreaterThanOrEqual(PALABRAS_MCQ_ROUND_SIZE)
  })

  it.each(['sinonimos', 'antonimos'] as const)(
    'buildPalabrasMcqRound(%s) genera ronda válida mixta',
    (productId) => {
      const round = buildPalabrasMcqRound(productId, PALABRAS_MCQ_ROUND_SIZE, 42)
      expect(round).toHaveLength(PALABRAS_MCQ_ROUND_SIZE)
      expect(round.some((q) => q.format === 'mcq')).toBe(true)
      expect(round.some((q) => q.format === 'match')).toBe(true)
      for (const q of round) {
        if (q.format === 'mcq') {
          expect(q.prompt.length).toBeGreaterThan(0)
          expect(q.options.length).toBeGreaterThanOrEqual(2)
          expect(q.correctIndex).toBeGreaterThanOrEqual(0)
          expect(q.correctIndex).toBeLessThan(q.options.length)
          const correct = q.options[q.correctIndex]!
          expect(correct.trim().length).toBeGreaterThan(0)
          const norms = q.options.map((o) => o.toLocaleLowerCase('es'))
          expect(new Set(norms).size).toBe(norms.length)
        } else {
          expect(q.left.length).toBeGreaterThanOrEqual(3)
          expect(q.rightOrder).toHaveLength(q.left.length)
          expect(new Set(q.rightOrder).size).toBe(q.left.length)
        }
      }
    },
  )

  it('ningún tip muestra Fitxa / eje editorial', () => {
    for (const productId of ['sinonimos', 'antonimos'] as const) {
      for (const q of buildPalabrasMcqRound(productId, 8, 99)) {
        if (q.format !== 'mcq' || !q.tip) continue
        expect(q.tip).not.toMatch(/fitxa|ficha\s*\d|eje\s+fitxa|anaya|vicens|solucionari/i)
      }
    }
  })

  it('sinonimos y antonimos explican el concepto al fallar', () => {
    const syn = buildPalabrasMcqRound('sinonimos', 8, 11).filter((q) => q.format === 'mcq')
    expect(syn.length).toBeGreaterThan(0)
    for (const q of syn) {
      expect(q.tip).toMatch(/sinónimo/i)
      expect(q.tip).toMatch(/mismo/i)
    }
    const ant = buildPalabrasMcqRound('antonimos', 8, 13).filter((q) => q.format === 'mcq')
    expect(ant.length).toBeGreaterThan(0)
    for (const q of ant) {
      expect(q.tip).toMatch(/antónimo/i)
      expect(q.tip).toMatch(/contrario/i)
    }
  })
})
