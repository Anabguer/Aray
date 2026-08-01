import { describe, expect, it } from 'vitest'
import rrPackJson from '@feinetas/ortografia/rr.json'
import { assertValidOrtographyLemmaPack, type OrtographyLemmaPack } from '@/feinetas/ortographyLemmaPack'
import {
  buildOrtographyPackRound,
  collectDistractors,
  lemmaToCorrectMcq,
} from '@/feinetas/ortographyMcq'

assertValidOrtographyLemmaPack(rrPackJson)
const pack = rrPackJson as OrtographyLemmaPack

describe('ortographyMcq (piloto RR)', () => {
  it('genera una ronda con las 21 palabras del pack', () => {
    const round = buildOrtographyPackRound(pack, 42)
    expect(round).toHaveLength(21)
    const ids = new Set(round.map((q) => q.lemmaId))
    expect(ids.size).toBe(21)
    expect(ids).toEqual(new Set(pack.lemmas.map((l) => l.id)))
  })

  it('coloca la forma correcta en options[correctIndex]', () => {
    for (const lemma of pack.lemmas) {
      const q = lemmaToCorrectMcq(lemma, pack, () => 0.3)
      expect(q.options[q.correctIndex]).toBe(lemma.lemma)
      expect(q.options.length).toBeGreaterThanOrEqual(2)
      expect(q.options.length).toBeLessThanOrEqual(4)
      expect(q.ruleText).toBe(lemma.ruleText)
    }
  })

  it('no inventa distractores fuera de errors del pack', () => {
    const allowed = new Set(
      pack.lemmas.flatMap((l) => [l.lemma, ...l.errors].map((s) => s.toLocaleLowerCase('es'))),
    )
    const lemma = pack.lemmas.find((l) => l.lemma === 'perro')!
    const distractors = collectDistractors(lemma, pack, 3)
    for (const d of distractors) {
      expect(allowed.has(d.toLocaleLowerCase('es'))).toBe(true)
      expect(d.toLocaleLowerCase('es')).not.toBe('perro')
    }
  })
})
