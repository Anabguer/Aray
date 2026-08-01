import { describe, expect, it } from 'vitest'
import {
  buildMoneyQuestion,
  buildMoneyRound,
  canMakeExact,
  formatEuro,
} from '@/money/generator'
import type { MoneyPlayMode } from '@/money/types'

const MODES: MoneyPlayMode[] = ['change', 'build', 'spare', 'sum', 'shortfall', 'mix']
const SEEDS = 300

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

  it('build siempre es construible (muchas semillas)', () => {
    for (let i = 0; i < SEEDS; i += 1) {
      const q = buildMoneyQuestion('build', 10_000 + i * 13)
      expect(q.kind).toBe('build')
      if (q.kind !== 'build') continue
      expect(canMakeExact(q.targetCents, q.coins)).toBe(true)
      expect(q.coins.length).toBeGreaterThanOrEqual(3)
      expect(q.prompt).toContain(formatEuro(q.targetCents))
    }
  })

  it('mcq: opciones únicas y respuesta correcta presente', () => {
    for (const mode of MODES) {
      for (let i = 0; i < 80; i += 1) {
        const q = buildMoneyQuestion(mode, 20_000 + i * 19 + mode.length)
        if (q.kind !== 'mcq') continue
        expect(q.options).toHaveLength(4)
        expect(new Set(q.options).size).toBe(4)
        expect(q.correctIndex).toBeGreaterThanOrEqual(0)
        expect(q.correctIndex).toBeLessThan(4)
      }
    }
  })

  it('ronda mix válida y builds resolubles', () => {
    const round = buildMoneyRound('mix', 8, 7)
    expect(round).toHaveLength(8)
    for (const q of round) {
      if (q.kind === 'build') expect(canMakeExact(q.targetCents, q.coins)).toBe(true)
    }
  })

  it('formatEuro usa dos decimales o euros enteros', () => {
    expect(formatEuro(350)).toBe('3,50 €')
    expect(formatEuro(500)).toBe('5 €')
    expect(formatEuro(1376)).toBe('13,76 €')
  })
})
