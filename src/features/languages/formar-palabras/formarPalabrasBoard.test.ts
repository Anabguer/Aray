import { describe, expect, it } from 'vitest'
import {
  correctPositionMask,
  initialBoard,
  keepCorrectRecycleWrong,
} from '@/features/languages/formar-palabras/formarPalabrasBoard'

describe('formarPalabrasBoard', () => {
  it('siempre coloca al menos la primera letra', () => {
    const board = initialBoard('mesa', ['a', 's', 'e', 'm'])
    expect(board.slots).toEqual(['m', null, null, null])
    expect(board.locked).toEqual([true, false, false, false])
    expect(board.pool.filter(Boolean).sort().join('')).toBe('aes')
  })

  it('marca solo posiciones correctas', () => {
    expect(correctPositionMask(['m', 'e', 'x', 'a'], 'mesa')).toEqual([true, true, false, true])
  })

  it('tras fallo conserva verdes y recicla el resto', () => {
    const result = keepCorrectRecycleWrong(
      ['m', 'e', 'x', 'a'],
      [null, null, 's', null],
      'mesa',
      [true, false, false, false],
    )
    expect(result.slots).toEqual(['m', 'e', null, 'a'])
    expect(result.locked).toEqual([true, true, false, true])
    expect(result.pool.filter(Boolean).sort().join('')).toBe('sx')
  })
})
