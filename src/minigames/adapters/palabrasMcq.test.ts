import { describe, expect, it } from 'vitest'
import {
  buildPalabrasMcqRound,
  PALABRAS_MCQ_ROUND_SIZE,
} from '@/minigames/adapters/palabrasMcq'
import { listSemanticItems } from '@/feinetas/wordsBanks'

const PRODUCT = 'sinonimos-antonimos' as const

describe('palabrasMcq adapters', () => {
  it('banco semantic tiene stock para synonym y antonym', () => {
    expect(listSemanticItems('synonym').length).toBeGreaterThanOrEqual(PALABRAS_MCQ_ROUND_SIZE)
    expect(listSemanticItems('antonym').length).toBeGreaterThanOrEqual(PALABRAS_MCQ_ROUND_SIZE)
  })

  it('buildPalabrasMcqRound mezcla MCQ, Empareja, sinónimos y antónimos', () => {
    const round = buildPalabrasMcqRound(PRODUCT, PALABRAS_MCQ_ROUND_SIZE, 42)
    expect(round).toHaveLength(PALABRAS_MCQ_ROUND_SIZE)
    expect(round.some((q) => q.format === 'mcq')).toBe(true)
    expect(round.some((q) => q.format === 'match')).toBe(true)
    expect(round.some((q) => q.relation === 'synonym')).toBe(true)
    expect(round.some((q) => q.relation === 'antonym')).toBe(true)
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
        if (q.relation === 'synonym') {
          expect(q.prompt).toMatch(/sinónimo/i)
          expect(q.tip).toMatch(/sinónimo/i)
        } else {
          expect(q.prompt).toMatch(/antónimo/i)
          expect(q.tip).toMatch(/antónimo/i)
        }
      } else {
        expect(q.left.length).toBeGreaterThanOrEqual(3)
        expect(q.rightOrder).toHaveLength(q.left.length)
        expect(new Set(q.rightOrder).size).toBe(q.left.length)
        expect(q.prompt).toMatch(q.relation === 'synonym' ? /sinónimos/i : /antónimos/i)
      }
    }
  })

  it('ningún tip muestra Fitxa / eje editorial', () => {
    for (const q of buildPalabrasMcqRound(PRODUCT, 8, 99)) {
      if (q.format !== 'mcq' || !q.tip) continue
      expect(q.tip).not.toMatch(/fitxa|ficha\s*\d|eje\s+fitxa|anaya|vicens|solucionari/i)
    }
  })
})
