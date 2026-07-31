import { describe, expect, it } from 'vitest'
import { buildMoneyQuestion, buildMoneyRound } from '@/money/generator'

describe('money generator 3.º', () => {
  it('change usa precios >= 12 €', () => {
    for (let i = 0; i < 30; i += 1) {
      const q = buildMoneyQuestion('change', 1000 + i)
      expect(q.kind).toBe('mcq')
      if (q.kind !== 'mcq') continue
      const m = /Cuesta (\d+)/.exec(q.detail ?? '')
      expect(m).toBeTruthy()
      expect(Number(m![1])).toBeGreaterThanOrEqual(12)
    }
  })

  it('shortfall pregunta cuánto falta', () => {
    const q = buildMoneyQuestion('shortfall', 42)
    expect(q.kind).toBe('mcq')
    if (q.kind !== 'mcq') return
    expect(q.prompt).toMatch(/falta/i)
    expect(q.options).toHaveLength(4)
  })

  it('ronda mix válida', () => {
    const round = buildMoneyRound('mix', 8, 7)
    expect(round).toHaveLength(8)
  })
})
