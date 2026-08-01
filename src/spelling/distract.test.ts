import { describe, expect, it } from 'vitest'
import { isJunkSpelling, makeDistractors } from '@/spelling/distract'
import { SPELL_BANK } from '@/spelling/bank'
import { buildSpellQuestion } from '@/spelling/generator'

describe('spelling distractors (calidad 3.º)', () => {
  it('perro → pero (nunca perrro / perroo)', () => {
    const [a, b, c] = makeDistractors('perro', 'r-rr')
    for (const d of [a, b, c]) {
      expect(isJunkSpelling(d)).toBe(false)
      expect(d.toLowerCase()).not.toMatch(/rrr|ooo|perroo|perrro/)
    }
    expect([a, b, c].map((x) => x.toLowerCase())).toContain('pero')
  })

  it('ningún distractor del banco es basura tipográfica', () => {
    for (const w of SPELL_BANK.slice(0, 200)) {
      for (const d of w.distractors) {
        expect(isJunkSpelling(d), `${w.word} → ${d}`).toBe(false)
      }
    }
  })

  it('opciones del pack de frases sin basura tipográfica', async () => {
    const { listActivePhraseItems } = await import('@/minigames/adapters/ortografiaComplete')
    for (const item of listActivePhraseItems()) {
      for (const opt of item.options) {
        expect(isJunkSpelling(opt), `${item.id}: ${opt}`).toBe(false)
      }
    }
  })

  it('intrusa de perro es error de regla, no basura', () => {
    const used = new Set<string>()
    // Forzar varias semillas hasta pillamos r-rr
    let saw = false
    for (let seed = 1; seed < 80; seed += 1) {
      used.clear()
      const q = buildSpellQuestion('intruder', seed, used)
      if (q.rule !== 'r-rr') continue
      saw = true
      for (const opt of q.options) {
        expect(isJunkSpelling(opt), opt).toBe(false)
        expect(opt.toLowerCase()).not.toMatch(/rrr|perroo|perrro/)
      }
    }
    expect(saw).toBe(true)
  })
})
