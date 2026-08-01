import { describe, expect, it } from 'vitest'
import {
  assertNear10Sane,
  buildCalcQuestion,
  buildCalcQueue,
  isOrderCorrect,
} from '@/calc/generator'
import type { CalcDifficulty, CalcPlayMode } from '@/calc/types'

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

const SEEDS = 200

describe('calc generator', () => {
  it('genera todos los modos sin romper', () => {
    for (const mode of MODES) {
      const q = buildCalcQuestion(mode, 42)
      expect(q.id).toBeTruthy()
      expect(q.difficulty).toMatch(/easy|medium|hard/)
      if (q.kind === 'mcq') {
        expect(q.options).toHaveLength(4)
        expect(q.correctIndex).toBeGreaterThanOrEqual(0)
        expect(q.correctIndex).toBeLessThan(4)
        expect(new Set(q.options).size).toBe(4)
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

  it('near10: sin triviales hacia 100; respuesta y opciones sanas', () => {
    for (let i = 0; i < SEEDS; i += 1) {
      for (const d of ['easy', 'medium', 'hard'] as CalcDifficulty[]) {
        const q = buildCalcQuestion('near10', 1000 + i * 17 + d.length, d)
        expect(q.kind).toBe('mcq')
        if (q.kind !== 'mcq') continue
        expect(() => assertNear10Sane(q)).not.toThrow()
      }
    }
  })

  it('cola equilibrada: sin 3 fáciles ni 2 difíciles seguidas', () => {
    for (let s = 0; s < 40; s += 1) {
      const queue = buildCalcQueue('mix', 24, 5000 + s * 97)
      let easyRun = 0
      let hardRun = 0
      for (const q of queue) {
        if (q.difficulty === 'easy') {
          easyRun += 1
          hardRun = 0
        } else if (q.difficulty === 'hard') {
          hardRun += 1
          easyRun = 0
        } else {
          easyRun = 0
          hardRun = 0
        }
        expect(easyRun).toBeLessThanOrEqual(3)
        expect(hardRun).toBeLessThanOrEqual(2)
      }
      const counts = { easy: 0, medium: 0, hard: 0 }
      for (const q of queue) counts[q.difficulty] += 1
      expect(counts.medium).toBeGreaterThan(0)
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
