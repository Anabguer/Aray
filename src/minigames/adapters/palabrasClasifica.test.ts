import { describe, expect, it } from 'vitest'
import {
  buildClasificaRound,
  buildClasificaSession,
  CLASIFICA_POOL_SIZE,
  CLASIFICA_ROUNDS,
} from '@/minigames/adapters/palabrasClasifica'
import { listClasificaItems } from '@/feinetas/wordsBanks'
import {
  assertValidWordsClasificaPack,
  validateWordsClasificaPack,
} from '@/feinetas/wordsClasificaPack'
import clasificaJson from '@feinetas/palabras/clasifica.json'

describe('palabras Clasifica', () => {
  it('pack JSON es válido', () => {
    expect(validateWordsClasificaPack(clasificaJson)).toEqual([])
    assertValidWordsClasificaPack(clasificaJson)
  })

  it('banco tiene stock suficiente y artículos coherentes', () => {
    const items = listClasificaItems()
    expect(items.length).toBeGreaterThanOrEqual(24)
    for (const item of items) {
      if (item.gender === 'm' && item.number === 'sg') expect(item.article).toBe('el')
      if (item.gender === 'f' && item.number === 'sg') {
        expect(['el', 'la']).toContain(item.article) // el agua (f)
      }
      if (item.gender === 'm' && item.number === 'pl') expect(item.article).toBe('los')
      if (item.gender === 'f' && item.number === 'pl') expect(item.article).toBe('las')
    }
  })

  it.each(['number', 'gender', 'article', 'gender-number'] as const)(
    'buildClasificaRound(%s) equilibrada',
    (kind) => {
      const round = buildClasificaRound(kind, 42)
      expect(round.chips.length).toBeGreaterThanOrEqual(4)
      expect(round.chips.length).toBeLessThanOrEqual(CLASIFICA_POOL_SIZE)
      expect(round.bins.length).toBeGreaterThanOrEqual(2)
      expect(round.prompt.length).toBeGreaterThan(0)
      expect(round.help.length).toBeGreaterThan(0)
      const binIds = new Set(round.bins.map((b) => b.id))
      for (const chip of round.chips) {
        expect(binIds.has(chip.binId)).toBe(true)
      }
      // Al menos 2 bandos representados
      const used = new Set(round.chips.map((c) => c.binId))
      expect(used.size).toBeGreaterThanOrEqual(2)
    },
  )

  it('ronda de género solo usa singular (sin plurales tipo lápices)', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const round = buildClasificaRound('gender', seed)
      expect(round.bins.map((b) => b.label)).toEqual(['Masculino', 'Femenino'])
      for (const chip of round.chips) {
        const item = listClasificaItems().find((i) => i.id === chip.id)
        expect(item?.number).toBe('sg')
      }
    }
  })

  it('sesión mezcla kinds y no repite ids en la misma ronda', () => {
    const session = buildClasificaSession(CLASIFICA_ROUNDS, 7)
    expect(session).toHaveLength(CLASIFICA_ROUNDS)
    const kinds = new Set(session.map((r) => r.kind))
    expect(kinds.has('number')).toBe(true)
    expect(kinds.has('gender')).toBe(true)
    expect(kinds.has('article')).toBe(true)
    expect(kinds.has('gender-number')).toBe(true)
    for (const round of session) {
      const ids = round.chips.map((c) => c.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})
