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

  it('sumas de 3.º no son de una cifra', () => {
    for (let i = 0; i < 40; i += 1) {
      const q = buildCalcQuestion('add', 200 + i)
      expect(q.kind).toBe('mcq')
      if (q.kind !== 'mcq') continue
      const m = /(\d+) \+ (\d+)/.exec(q.expression ?? '')
      expect(m).toBeTruthy()
      const a = Number(m![1])
      const b = Number(m![2])
      expect(a).toBeGreaterThanOrEqual(20)
      expect(b).toBeGreaterThanOrEqual(20)
      expect(q.options[q.correctIndex]).toBe(String(a + b))
    }
  })

  it('ordenar usa al menos 3 cifras', () => {
    for (let i = 0; i < 20; i += 1) {
      const q = buildCalcQuestion('order', 300 + i)
      expect(q.kind).toBe('order')
      if (q.kind !== 'order') continue
      expect(Math.min(...q.items)).toBeGreaterThanOrEqual(100)
    }
  })

  it('comparar usa al menos 3 cifras', () => {
    for (let i = 0; i < 20; i += 1) {
      const q = buildCalcQuestion('compare', 400 + i)
      expect(q.kind).toBe('compare')
      if (q.kind !== 'compare') continue
      expect(q.left).toBeGreaterThanOrEqual(100)
      expect(q.right).toBeGreaterThanOrEqual(100)
    }
  })

  it('cerca de 10/100 completa decenas o centenas', () => {
    for (let i = 0; i < 30; i += 1) {
      const q = buildCalcQuestion('near10', 100 + i)
      expect(q.kind).toBe('mcq')
      if (q.kind !== 'mcq') continue
      const m10 = /(\d+) \+ \? = 10$/.exec(q.expression ?? '')
      const m100 = /(\d+) \+ \? = 100$/.exec(q.expression ?? '')
      expect(m10 || m100).toBeTruthy()
      if (m100) {
        const a = Number(m100[1])
        expect(q.options[q.correctIndex]).toBe(String(100 - a))
      } else if (m10) {
        const a = Number(m10[1])
        expect(q.options[q.correctIndex]).toBe(String(10 - a))
      }
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
