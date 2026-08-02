import { describe, expect, it } from 'vitest'
import {
  boardLetterInvariant,
  correctPositionMask,
  initialBoard,
  keepCorrectRecycleWrong,
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

  it('fija la 2.ª letra acertada y no la devuelve al montón', () => {
    // Pista inicial + 2.ª correcta; el resto mal
    const first = keepCorrectRecycleWrong(['m', 'e', 'x', 'x'], 'mesa')
    expect(first.slots).toEqual(['m', 'e', null, null])
    expect(first.locked).toEqual([true, true, false, false])
    expect(first.pool.sort().join('')).toBe('as')
    expect(boardLetterInvariant(first.slots, first.pool, 'mesa')).toBe(true)

    // Segundo intento: mantiene m,e; acierta s; falla la última
    const second = keepCorrectRecycleWrong(['m', 'e', 's', 'x'], 'mesa')
    expect(second.slots).toEqual(['m', 'e', 's', null])
    expect(second.locked).toEqual([true, true, true, false])
    expect(second.pool).toEqual(['a'])
    expect(boardLetterInvariant(second.slots, second.pool, 'mesa')).toBe(true)

    // La 2.ª letra NO reaparece en el montón
    expect(second.pool).not.toContain('e')
  })

  it('con letras repetidas (lluvia) no suelta una L ya fija', () => {
    const kept = keepCorrectRecycleWrong(['l', 'l', 'x', 'x', 'x', 'x'], 'lluvia')
    expect(kept.slots).toEqual(['l', 'l', null, null, null, null])
    expect(kept.locked).toEqual([true, true, false, false, false, false])
    expect(kept.pool.sort().join('')).toBe('aiuv')
    expect(kept.pool.filter((ch) => ch === 'l')).toHaveLength(0)
    expect(boardLetterInvariant(kept.slots, kept.pool, 'lluvia')).toBe(true)
  })
})
