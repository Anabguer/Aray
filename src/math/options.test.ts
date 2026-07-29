import { describe, expect, it } from 'vitest'
import { buildAnswerOptions, hasUniqueOptions } from '@/math/options'
import { makeFact, factKey } from '@/math/tables'

describe('multiplicaciones y opciones', () => {
  it('genera el producto correcto', () => {
    expect(makeFact(7, 8).product).toBe(56)
  })

  it('trata 3×7 y 7×3 como la misma clave', () => {
    expect(factKey(3, 7)).toBe(factKey(7, 3))
    expect(factKey(3, 7)).toBe('3x7')
  })

  it('genera 4 opciones únicas incluyendo la correcta', () => {
    const fact = makeFact(6, 7)
    for (let i = 0; i < 20; i += 1) {
      const options = buildAnswerOptions(fact, () => (i + 1) / 21)
      expect(options).toHaveLength(4)
      expect(hasUniqueOptions(options)).toBe(true)
      expect(options).toContain(42)
    }
  })
})
