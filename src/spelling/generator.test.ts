import { describe, expect, it } from 'vitest'
import { buildSpellQuestion, buildSpellRound, hardUnitAt } from '@/spelling/generator'
import { SPELL_BANK } from '@/spelling/bank'
import { SPELL_CONTEXTS, type SpellPlayMode } from '@/spelling/types'

/** Generator legacy residual (banco TS); complete ya no vive aquí. */
const MODES: SpellPlayMode[] = ['missing', 'correct', 'picture', 'intruder', 'mix', 'review']

describe('generator residual (no complete)', () => {
  it('SPELL_CONTEXTS vacío tras Fase 4', () => {
    expect(SPELL_CONTEXTS).toEqual([])
    expect(SPELL_BANK.length).toBeGreaterThanOrEqual(900)
  })

  it('genera rondas válidas en modos de bank', () => {
    for (const mode of MODES) {
      const round = buildSpellRound(mode, 8, 11)
      expect(round).toHaveLength(8)
      for (const q of round) {
        expect(q.options).toHaveLength(4)
        expect(q.correctIndex).toBeGreaterThanOrEqual(0)
        expect(q.correctIndex).toBeLessThan(4)
      }
    }
  })

  it('complete lanza (retirado del generator)', () => {
    expect(() => buildSpellQuestion('complete', 1)).toThrow(/retirado/)
  })

  it('hardUnitAt funciona', () => {
    expect(hardUnitAt('perro', 2).unit.toLowerCase()).toMatch(/r/)
  })
})
