import { describe, expect, it } from 'vitest'
import {
  ALPHABET,
  buildAlphabetRound,
  buildMissingQuestion,
  buildNeighborQuestion,
  buildOrderLettersQuestion,
  buildOrderWordsQuestion,
  compareLetters,
  compareWords,
  isOrderComplete,
  letterIndex,
} from '@/alphabet'

describe('alfabeto español', () => {
  it('incluye Ñ entre N y O', () => {
    expect(ALPHABET).toHaveLength(27)
    expect(letterIndex('N')).toBeLessThan(letterIndex('Ñ'))
    expect(letterIndex('Ñ')).toBeLessThan(letterIndex('O'))
  })

  it('ordena palabras con ñ después de n', () => {
    expect(compareWords('nube', 'ñandú')).toBeLessThan(0)
    expect(compareWords('ñandú', 'ojo')).toBeLessThan(0)
    expect(compareLetters('N', 'Ñ')).toBeLessThan(0)
    expect(compareLetters('Ñ', 'O')).toBeLessThan(0)
  })
})

describe('generadores de abecedario', () => {
  it('letra que falta: hueco y respuesta coherentes', () => {
    const q = buildMissingQuestion(2, 42)
    expect(q.sequence.filter((x) => x == null)).toHaveLength(1)
    expect(q.sequence[q.blankIndex]).toBeNull()
    expect(q.options).toContain(q.answer)
    expect(q.options.length).toBeGreaterThanOrEqual(4)
  })

  it('vecina: next/prev correctos', () => {
    const q = buildNeighborQuestion(1, 99)
    const idx = letterIndex(q.letter)
    const expected =
      q.direction === 'next' ? ALPHABET[idx + 1] : ALPHABET[idx - 1]
    expect(q.answer).toBe(expected)
    expect(q.options).toContain(q.answer)
  })

  it('ordena letras según dirección', () => {
    const asc = buildOrderLettersQuestion(2, 7, 'asc')
    expect(asc.answer).toEqual([...asc.answer].sort(compareLetters))
    const desc = buildOrderLettersQuestion(3, 8, 'desc')
    expect(desc.answer).toEqual([...desc.answer].sort(compareLetters).reverse())
  })

  it('ordena palabras según dirección', () => {
    const q = buildOrderWordsQuestion(2, 11, 'asc')
    expect(q.words).toHaveLength(q.answer.length)
    expect(q.positions).toHaveLength(q.words.length)
    expect(q.answer).toEqual([...q.answer].sort(compareWords))
  })

  it('ronda random mezcla tipos', () => {
    const round = buildAlphabetRound('random', 8, 12345)
    expect(round).toHaveLength(8)
    const kinds = new Set(round.map((q) => q.kind))
    expect(kinds.size).toBeGreaterThan(1)
  })

  it('isOrderComplete detecta progreso y error', () => {
    expect(isOrderComplete(['A'], ['A', 'B', 'C'])).toBe('progress')
    expect(isOrderComplete(['A', 'B', 'C'], ['A', 'B', 'C'])).toBe('correct')
    expect(isOrderComplete(['A', 'C'], ['A', 'B', 'C'])).toBe('wrong')
  })
})
