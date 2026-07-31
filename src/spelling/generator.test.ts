import { describe, expect, it } from 'vitest'
import { buildSpellRound } from '@/spelling/generator'
import { SPELL_BANK, SPELL_CONTEXTS, type SpellPlayMode } from '@/spelling/types'

const MODES: SpellPlayMode[] = ['missing', 'correct', 'picture', 'intruder', 'complete', 'mix']
const BANK_WORDS = new Set(SPELL_BANK.map((w) => w.word.toLowerCase()))

describe('ortografía 3.º (cuaderno real)', () => {
  it('banco y contextos sin opciones duplicadas ni auto-distractores', () => {
    for (const w of SPELL_BANK) {
      expect(w.distractors).toHaveLength(3)
      expect(new Set(w.distractors.map((d) => d.toLowerCase())).size).toBe(3)
      expect(w.distractors.map((d) => d.toLowerCase()).includes(w.word.toLowerCase())).toBe(false)
      // Evitar trampas absurdas tipo “pakete” (k por qu)
      expect(w.distractors.some((d) => /[^c]k|k[^e]/i.test(d))).toBe(false)
    }
    for (const c of SPELL_CONTEXTS) {
      expect(new Set(c.options.map((o) => o.trim().toLowerCase())).size).toBe(4)
      expect(c.sentence).toContain('___')
    }
  })

  it('genera rondas válidas', () => {
    for (const mode of MODES) {
      const round = buildSpellRound(mode, 8, 11)
      expect(round).toHaveLength(8)
      for (const q of round) {
        expect(q.options).toHaveLength(4)
        expect(new Set(q.options.map((o) => o.toLowerCase())).size).toBe(4)
        expect(q.correctIndex).toBeGreaterThanOrEqual(0)
        expect(q.correctIndex).toBeLessThan(4)
      }
    }
  })

  it('completar frase usa contextos (no trampas infantiles)', () => {
    const round = buildSpellRound('complete', 10, 7)
    for (const q of round) {
      expect(q.display).toMatch(/___/)
      expect(q.prompt.toLowerCase()).toMatch(/frase/)
    }
  })

  it('intrusa: tip genérico y una sola mal escrita', () => {
    const round = buildSpellRound('intruder', 10, 42)
    for (const q of round) {
      expect(q.tip?.toLowerCase()).not.toMatch(/paquete|pa-que/)
      const answer = q.options[q.correctIndex]!
      expect(BANK_WORDS.has(answer.toLowerCase())).toBe(false)
      expect(q.options.filter((o) => BANK_WORDS.has(o.toLowerCase())).length).toBe(3)
    }
  })
})
