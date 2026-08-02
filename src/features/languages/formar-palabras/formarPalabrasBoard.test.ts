import { describe, expect, it } from 'vitest'
import {
  boardLetterInvariant,
  correctPositionMask,
  initialBoard,
  keepCorrectRecycleWrong,
  remainingLetters,
} from '@/features/languages/formar-palabras/formarPalabrasBoard'

describe('formarPalabrasBoard', () => {
  it('siempre coloca al menos la primera letra sin duplicar el montón', () => {
    const board = initialBoard('lluvia', ['u', 'a', 'v', 'i', 'l', 'l'])
    expect(board.slots).toEqual(['l', null, null, null, null, null])
    expect(board.locked[0]).toBe(true)
    expect(board.pool).toHaveLength(5)
    expect(boardLetterInvariant(board.slots, board.pool, 'lluvia')).toBe(true)
  })

  it('marca solo posiciones correctas', () => {
    expect(correctPositionMask(['m', 'e', 'x', 'a'], 'mesa')).toEqual([true, true, false, true])
  })

  it('tras fallo conserva verdes y no inventa letras extra', () => {
    const result = keepCorrectRecycleWrong(
      ['l', 'l', 'u', 'x', 'i', 'a'],
      'lluvia',
      [true, false, false, false, false, false],
    )
    expect(result.slots).toEqual(['l', 'l', 'u', null, 'i', 'a'])
    expect(result.locked).toEqual([true, true, true, false, true, true])
    expect(result.pool.sort().join('')).toBe('v')
    expect(boardLetterInvariant(result.slots, result.pool, 'lluvia')).toBe(true)
  })

  it('remainingLetters resta multicomjuntos (letras repetidas)', () => {
    expect(remainingLetters(['l', 'l', 'u'], ['l']).sort().join('')).toBe('lu')
  })

  it('simula varios fallos sin crecer el montón', () => {
    let slots: Array<string | null> = ['l', 'u', 'v', 'i', 'a', 'l']
    let locked = [true, false, false, false, false, false]
    for (let i = 0; i < 5; i += 1) {
      const kept = keepCorrectRecycleWrong(slots, 'lluvia', locked)
      expect(boardLetterInvariant(kept.slots, kept.pool, 'lluvia')).toBe(true)
      expect(kept.pool.length + kept.slots.filter(Boolean).length).toBe(6)
      // Relleno absurdo a propósito y otro fallo
      slots = [...kept.slots]
      let pi = 0
      for (let s = 0; s < slots.length; s += 1) {
        if (slots[s] == null) slots[s] = kept.pool[pi++] ?? 'x'
      }
      locked = kept.locked
    }
  })
})
