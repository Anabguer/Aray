import { describe, expect, it } from 'vitest'
import {
  buildMoneyQuestion,
  buildMoneyRound,
  canMakeExact,
  decomposeToPieces,
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

  it('sum y spare incluyen piezas visuales', () => {
    const sum = buildMoneyQuestion('sum', 55)
    expect(sum.kind).toBe('mcq')
    if (sum.kind !== 'mcq') return
    expect(sum.pieces?.length).toBeGreaterThanOrEqual(3)
    expect(sum.pieces!.some((p) => p.kind === 'bill')).toBe(true)
    expect(sum.pieces!.reduce((s, p) => s + p.cents, 0)).toBe(
      Number(sum.questionId!.split(':').pop()),
    )

    const spare = buildMoneyQuestion('spare', 77)
    expect(spare.kind).toBe('mcq')
    if (spare.kind !== 'mcq') return
    expect(spare.pieces).toHaveLength(4)
    expect(spare.pieces!.every((p) => p.kind === 'coin')).toBe(true)
  })

  it('change y shortfall incluyen escena Cuesta + pago/tengo', () => {
    const change = buildMoneyQuestion('change', 88)
    expect(change.kind).toBe('mcq')
    if (change.kind !== 'mcq') return
    expect(change.scene).toHaveLength(2)
    expect(change.scene![0]!.label).toBe('Cuesta')
    expect(change.scene![1]!.label).toBe('Pagas')
    expect(change.scene![0]!.pieces.length).toBeGreaterThan(0)
    expect(change.scene![1]!.pieces.length).toBeGreaterThan(0)

    const shortfall = buildMoneyQuestion('shortfall', 99)
    expect(shortfall.kind).toBe('mcq')
    if (shortfall.kind !== 'mcq') return
    expect(shortfall.scene?.[0]?.label).toBe('Cuesta')
    expect(shortfall.scene?.[1]?.label).toBe('Tienes')
  })

  it('decomposeToPieces respeta billetes y tope', () => {
    const pieces = decomposeToPieces(2055)
    expect(pieces.some((p) => p.kind === 'bill' && p.cents === 2000)).toBe(true)
    expect(pieces.reduce((s, p) => s + p.cents, 0)).toBe(2055)
    expect(decomposeToPieces(9999, 3).length).toBeLessThanOrEqual(3)
  })
})
