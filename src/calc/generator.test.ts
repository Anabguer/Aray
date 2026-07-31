import { describe, expect, it } from 'vitest'
import { buildCalcQuestion, buildCalcQueue, isOrderCorrect } from '@/calc/generator'
import type { CalcPlayMode } from '@/calc/types'

const MODES: CalcPlayMode[] = [
  'add',
  'sub',
  'missing',
  'doubles',
  'halves',
  'near10',
  'compare',
  'order',
  'truefalse',
  'mix',
]

describe('calc generator', () => {
  it('genera todos los modos sin romper', () => {
    for (const mode of MODES) {
      const q = buildCalcQuestion(mode, 42)
      expect(q.id).toBeTruthy()
      if (q.kind === 'mcq') {
        expect(q.options).toHaveLength(4)
        expect(q.correctIndex).toBeGreaterThanOrEqual(0)
        expect(q.correctIndex).toBeLessThan(4)
      }
      if (q.kind === 'order') {
        expect(q.items).toHaveLength(4)
        expect([...q.answer].sort((a, b) => a - b)).toEqual(q.answer)
      }
      if (q.kind === 'compare') {
        expect(q.left).not.toBe(q.right)
      }
    }
  })

  it('cerca de 10 completa decenas', () => {
    for (let i = 0; i < 20; i += 1) {
      const q = buildCalcQuestion('near10', 100 + i)
      expect(q.kind).toBe('mcq')
      if (q.kind !== 'mcq') continue
      const m = /(\d+) \+ \? = 10/.exec(q.expression ?? '')
      expect(m).toBeTruthy()
      const a = Number(m![1])
      expect(q.options[q.correctIndex]).toBe(String(10 - a))
    }
  })

  it('ordena valida la secuencia', () => {
    expect(isOrderCorrect([1, 2, 3], [1, 2, 3])).toBe(true)
    expect(isOrderCorrect([2, 1, 3], [1, 2, 3])).toBe(false)
  })

  it('cola mix tiene variedad', () => {
    const queue = buildCalcQueue('mix', 18, 7)
    const kinds = new Set(queue.map((q) => q.kind))
    expect(kinds.size).toBeGreaterThan(1)
  })
})
