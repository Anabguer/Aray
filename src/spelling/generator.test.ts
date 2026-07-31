import { describe, expect, it } from 'vitest'
import { buildSpellRound } from '@/spelling/generator'
import { SPELL_BANK, type SpellPlayMode } from '@/spelling/types'

const MODES: SpellPlayMode[] = ['missing', 'correct', 'picture', 'intruder', 'complete', 'mix']
const BANK_WORDS = new Set(SPELL_BANK.map((w) => w.word))

describe('spelling generator', () => {
  it('genera rondas válidas en todos los modos', () => {
    for (const mode of MODES) {
      const round = buildSpellRound(mode, 8, 11)
      expect(round).toHaveLength(8)
      for (const q of round) {
        expect(q.options).toHaveLength(4)
        expect(q.correctIndex).toBeGreaterThanOrEqual(0)
        expect(q.correctIndex).toBeLessThan(4)
        expect(q.options[q.correctIndex]).toBeTruthy()
      }
    }
  })

  it('en modo intrusa pide la mal escrita y solo hay una', () => {
    const round = buildSpellRound('intruder', 12, 42)
    for (const q of round) {
      expect(q.prompt.toLowerCase()).toMatch(/mal|intrusa/)
      const answer = q.options[q.correctIndex]!
      expect(BANK_WORDS.has(answer)).toBe(false)
      const goodCount = q.options.filter((o) => BANK_WORDS.has(o)).length
      expect(goodCount).toBe(3)
    }
  })
})
