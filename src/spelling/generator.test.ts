import { describe, expect, it } from 'vitest'
import { buildSpellRound } from '@/spelling/generator'
import { SPELL_BANK, type SpellPlayMode } from '@/spelling/types'

const MODES: SpellPlayMode[] = ['missing', 'correct', 'picture', 'intruder', 'complete', 'mix']
const BANK_WORDS = new Set(SPELL_BANK.map((w) => w.word))

describe('spelling generator (repaso 3.º)', () => {
  it('el banco no mete la forma correcta como distractor', () => {
    for (const w of SPELL_BANK) {
      expect(w.distractors).toHaveLength(3)
      expect(new Set(w.distractors).size).toBe(3)
      expect(w.distractors.includes(w.word)).toBe(false)
    }
  })

  it('genera rondas válidas en todos los modos', () => {
    for (const mode of MODES) {
      const round = buildSpellRound(mode, 8, 11)
      expect(round).toHaveLength(8)
      for (const q of round) {
        expect(q.options).toHaveLength(4)
        expect(q.correctIndex).toBeGreaterThanOrEqual(0)
        expect(q.correctIndex).toBeLessThan(4)
        expect(new Set(q.options).size).toBe(4)
      }
    }
  })

  it('en imagen/correcta las 3 trampas son faltas de la misma palabra', () => {
    for (const mode of ['picture', 'correct', 'complete'] as const) {
      const round = buildSpellRound(mode, 12, 99)
      for (const q of round) {
        const answer = q.options[q.correctIndex]!
        expect(BANK_WORDS.has(answer)).toBe(true)
        const others = q.options.filter((_, i) => i !== q.correctIndex)
        for (const o of others) {
          expect(BANK_WORDS.has(o)).toBe(false)
        }
        expect(q.tip).toBeTruthy()
      }
    }
  })

  it('en modo intrusa la respuesta es la mal escrita', () => {
    const round = buildSpellRound('intruder', 12, 42)
    for (const q of round) {
      const answer = q.options[q.correctIndex]!
      expect(BANK_WORDS.has(answer)).toBe(false)
      expect(q.options.filter((o) => BANK_WORDS.has(o))).toHaveLength(3)
    }
  })
})
