import { describe, expect, it } from 'vitest'
import { buildSpellRound } from '@/spelling/generator'
import type { SpellPlayMode } from '@/spelling/types'

const MODES: SpellPlayMode[] = ['missing', 'correct', 'picture', 'intruder', 'complete', 'mix']

describe('spelling generator', () => {
  it('genera rondas válidas en todos los modos', () => {
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
})
