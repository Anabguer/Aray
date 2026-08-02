import { describe, expect, it } from 'vitest'
import {
  boardLetterInvariant,
  correctPositionMask,
  derivedPool,
  initialBoard,
  lockCorrectClearWrong,
} from '@/features/languages/formar-palabras/formarPalabrasBoard'

describe('formarPalabrasBoard', () => {
  it('inicial: 1 fija + montón = resto exacto', () => {
    const board = initialBoard('tienda', ['a', 'n', 'd', 'e', 'i', 't'])
    const pool = derivedPool('tienda', board.slots, board.scrambleOrder)
    expect(board.slots[0]).toBe('t')
    expect(pool).toHaveLength(5)
    expect(boardLetterInvariant(board.slots, pool, 'tienda')).toBe(true)
  })

  it('derivedPool nunca crece tras varios fallos', () => {
    const palabra = 'tienda'
    const scramble = ['i', 'e', 'n', 'd', 'a', 't']
    let slots = initialBoard(palabra, scramble).slots
    let locked = initialBoard(palabra, scramble).locked

    for (let fail = 0; fail < 5; fail += 1) {
      // Rellena mal el resto
      const pool = derivedPool(palabra, slots, scramble)
      expect(pool.length + slots.filter(Boolean).length).toBe(palabra.length)
      let p = 0
      slots = slots.map((ch, i) => {
        if (ch != null && locked[i]) return ch
        return pool[p++] ?? null
      })
      // Desordena a propósito la 2.ª casilla si se puede
      if (slots[1] && slots[1] !== 'i') {
        /* already wrong */
      } else if (slots[2]) {
        slots = [...slots]
        slots[2] = slots[2] === 'e' ? 'a' : slots[2]
      }
      const kept = lockCorrectClearWrong(slots, palabra)
      slots = kept.slots
      locked = kept.locked
      const nextPool = derivedPool(palabra, slots, scramble)
      expect(boardLetterInvariant(slots, nextPool, palabra)).toBe(true)
      expect(nextPool.length).toBe(palabra.length - slots.filter(Boolean).length)
    }
  })

  it('2.ª letra acertada queda fija y fuera del montón', () => {
    const kept = lockCorrectClearWrong(['t', 'i', 'x', 'x', 'x', 'x'], 'tienda')
    expect(kept.slots).toEqual(['t', 'i', null, null, null, null])
    expect(kept.locked).toEqual([true, true, false, false, false, false])
    const pool = derivedPool('tienda', kept.slots, ['e', 'n', 'd', 'a', 'i', 't'])
    expect(pool.sort().join('')).toBe('aden')
    expect(pool).not.toContain('i')
    expect(correctPositionMask(kept.slots, 'tienda')[1]).toBe(true)
  })
})
