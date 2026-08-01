import { describe, expect, it } from 'vitest'
import { buildSpellQuestion, buildSpellRound, hardUnitAt } from '@/spelling/generator'
import { SPELL_BANK } from '@/spelling/bank'
import type { SpellPlayMode } from '@/spelling/types'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/** Generator residual (banco TS); no alimenta buildRound del juego. */
const MODES: SpellPlayMode[] = ['missing', 'correct', 'picture', 'intruder', 'mix', 'review']

describe('generator residual (no complete)', () => {
  it('SPELL_CONTEXTS eliminado; bank residual sigue existiendo', () => {
    const typesSrc = readFileSync(
      path.resolve(__dirname, 'types.ts'),
      'utf8',
    )
    expect(typesSrc).not.toMatch(/\bSPELL_CONTEXTS\b/)
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
