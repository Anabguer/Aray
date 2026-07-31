import { describe, expect, it } from 'vitest'
import { buildSpellQuestion, buildSpellRound, hardUnitAt } from '@/spelling/generator'
import { SPELL_BANK } from '@/spelling/bank'
import { SPELL_CONTEXTS, type SpellPlayMode } from '@/spelling/types'

const MODES: SpellPlayMode[] = [
  'missing',
  'correct',
  'picture',
  'intruder',
  'complete',
  'mix',
  'review',
]
const BANK_WORDS = new Set(SPELL_BANK.map((w) => w.word.toLowerCase()))

describe('ortografía 3.º (cuaderno real)', () => {
  it('banco amplio (~1000) y contextos válidos', () => {
    expect(SPELL_BANK.length).toBeGreaterThanOrEqual(900)
    for (const w of SPELL_BANK.slice(0, 80)) {
      expect(w.distractors).toHaveLength(3)
      expect(new Set(w.distractors.map((d) => d.toLowerCase())).size).toBe(3)
      expect(w.distractors.map((d) => d.toLowerCase()).includes(w.word.toLowerCase())).toBe(false)
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
        expect(q.targetKey).toBeTruthy()
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

  it('ll y rr cuentan como una sola letra en el hueco', () => {
    expect(hardUnitAt('amarillo', 5)).toEqual({ start: 5, unit: 'll' })
    expect(hardUnitAt('amarillo', 6)).toEqual({ start: 5, unit: 'll' })
    expect(hardUnitAt('perro', 2)).toEqual({ start: 2, unit: 'rr' })
    expect(hardUnitAt('caballo', 2)).toEqual({ start: 2, unit: 'b' })

    for (let seed = 0; seed < 80; seed += 1) {
      const q = buildSpellQuestion('missing', seed)
      if (!q.display) continue
      expect(q.display).not.toMatch(/l_l/i)
      expect(q.display).not.toMatch(/r_r/i)
      const answer = q.options[q.correctIndex]!
      if (answer.toLowerCase() === 'll' || answer.toLowerCase() === 'rr') {
        expect(q.display).toMatch(/_/)
        expect(answer).toBe(answer.toUpperCase())
        expect(answer).toMatch(/^(LL|RR)$/)
      }
    }
  })
})
