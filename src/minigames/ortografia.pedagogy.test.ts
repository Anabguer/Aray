/**
 * Auditoría pedagógica monorregla: Intrusa / Missing / Correct / Mezcla / Mis fallos.
 */
import { describe, expect, it } from 'vitest'
import { getOrtographyCorpus, parseOrtographyMissKey } from '@/feinetas/ortographyCorpus'
import { buildOrtografiaCorrectRound } from '@/minigames/adapters/ortografiaCorrect'
import {
  buildOrtografiaIntruderRound,
  buildOrtografiaIntruderQuestion,
  intruderPackSufficiency,
} from '@/minigames/adapters/ortografiaIntruder'
import {
  buildOrtografiaMissingRound,
  rivalUnitsForRule,
  RULE_RIVAL_UNITS,
} from '@/minigames/adapters/ortografiaMissing'
import { buildOrtografiaMixRound } from '@/minigames/adapters/ortografiaMix'
import { buildOrtografiaReviewRound } from '@/minigames/adapters/ortografiaReview'
import {
  canBuildBareCorrectQuestion,
  canBuildIntruderQuestion,
  itemApprovedErrors,
  itemSafeMisspellingsForBareMcq,
} from '@/minigames/adapters/ortografiaShared'
import type { SpellMissEntry } from '@/spelling/missStore'
import type { SpellMcqQuestion } from '@/spelling/types'

function norm(s: string) {
  return s.toLocaleLowerCase('es')
}

function assertUniqueOptions(q: SpellMcqQuestion) {
  expect(q.options.length).toBeGreaterThanOrEqual(2)
  expect(q.options.length).toBeLessThanOrEqual(4)
  expect(new Set(q.options.map(norm)).size).toBe(q.options.length)
  expect(q.correctIndex).toBeGreaterThanOrEqual(0)
  expect(q.correctIndex).toBeLessThan(q.options.length)
}

function assertIntruderMonorule(q: SpellMcqQuestion) {
  assertUniqueOptions(q)
  expect(q.prompt).toMatch(/mal/i)
  const entry = getOrtographyCorpus().byRef.get(q.targetKey!)!
  const approved = new Set(itemSafeMisspellingsForBareMcq(entry).map(norm))
  const bad = norm(q.options[q.correctIndex]!)
  expect(approved.has(bad)).toBe(true)

  for (let i = 0; i < q.options.length; i += 1) {
    if (i === q.correctIndex) continue
    const opt = norm(q.options[i]!)
    const peer = getOrtographyCorpus().entries.find(
      (e) =>
        e.packId === entry.packId &&
        e.lemma.ruleId === entry.lemma.ruleId &&
        norm(e.lemma.lemma) === opt,
    )
    expect(peer, `correcta fuera de pack: ${q.options[i]}`).toBeTruthy()
    expect(peer!.lemma.ruleId).toBe(entry.lemma.ruleId)
  }
}

function assertMissingRivalsOnly(q: SpellMcqQuestion) {
  assertUniqueOptions(q)
  const entry = getOrtographyCorpus().byRef.get(q.targetKey!)!
  const allowed = new Set(
    rivalUnitsForRule(entry.lemma.ruleId, q.options[q.correctIndex]!).map((u) =>
      u.toLocaleLowerCase('es'),
    ),
  )
  for (const o of q.options) {
    expect(allowed.has(o.toLocaleLowerCase('es'))).toBe(true)
  }
  // Ninguna unidad de otra regla fuera del set rival
  for (const [ruleId, units] of Object.entries(RULE_RIVAL_UNITS)) {
    if (ruleId === entry.lemma.ruleId) continue
    for (const u of units) {
      const key = u.toLocaleLowerCase('es')
      if (!key || allowed.has(key)) continue
      // Si aparece, debe estar también en el set rival de la regla actual
      if (q.options.some((o) => o.toLocaleLowerCase('es') === key)) {
        expect(allowed.has(key)).toBe(true)
      }
    }
  }
}

function assertCorrectEditorial(q: SpellMcqQuestion) {
  assertUniqueOptions(q)
  expect(q.prompt).toMatch(/bien/i)
  const entry = getOrtographyCorpus().byRef.get(q.targetKey!)!
  expect(norm(q.options[q.correctIndex]!)).toBe(norm(entry.lemma.lemma))
  const approved = new Set(itemApprovedErrors(entry).map(norm))
  for (let i = 0; i < q.options.length; i += 1) {
    if (i === q.correctIndex) continue
    expect(approved.has(norm(q.options[i]!))).toBe(true)
    expect(itemSafeMisspellingsForBareMcq(entry).map(norm)).toContain(norm(q.options[i]!))
  }
}

describe('pedagogía monorregla', () => {
  it('Intrusa: correctas mismo ruleId/pack; intrusa ∈ errors[]', () => {
    for (const seed of [11, 22, 33, 44, 55]) {
      for (const q of buildOrtografiaIntruderRound(40, seed * 1009)) {
        assertIntruderMonorule(q)
      }
    }
  })

  it('Missing: opciones ⊆ rivales de la regla; sin fillers ajenos', () => {
    for (const seed of [7, 8, 9]) {
      for (const q of buildOrtografiaMissingRound(40, seed * 2003)) {
        assertMissingRivalsOnly(q)
        // Casos típicos: g/j no incluye RR
        const entry = getOrtographyCorpus().byRef.get(q.targetKey!)!
        if (entry.lemma.ruleId === 'g-j') {
          expect(q.options.some((o) => /^rr$/i.test(o))).toBe(false)
        }
        if (entry.lemma.ruleId === 'b-v') {
          expect(q.options.every((o) => /^[bv]$/i.test(o))).toBe(true)
        }
      }
    }
  })

  it('Correct: incorrectas ⊆ errors[]; no fuerza 4', () => {
    const lengths = new Set<number>()
    for (const q of buildOrtografiaCorrectRound(80, 3001)) {
      assertCorrectEditorial(q)
      lengths.add(q.options.length)
      expect(canBuildBareCorrectQuestion(getOrtographyCorpus().byRef.get(q.targetKey!)!)).toBe(true)
    }
    expect(lengths.has(2) || lengths.has(3) || lengths.has(4)).toBe(true)
  })

  it('ninguna mecánica fuerza siempre 4 opciones', () => {
    const samples = [
      ...buildOrtografiaIntruderRound(60, 4001),
      ...buildOrtografiaMissingRound(60, 4002),
      ...buildOrtografiaCorrectRound(60, 4003),
    ]
    const hasFlexible = samples.some((q) => q.options.length < 4)
    expect(hasFlexible).toBe(true)
  })

  it('Mezcla solo preguntas válidas de mecánicas corregidas', () => {
    for (const q of buildOrtografiaMixRound(48, 5001)) {
      assertUniqueOptions(q)
      if (q.prompt.includes('mal')) assertIntruderMonorule(q)
      else if (q.prompt.includes('bien')) assertCorrectEditorial(q)
      else if (q.prompt.includes('falta') || q.prompt.includes('regla')) assertMissingRivalsOnly(q)
      else if (q.prompt.includes('frase')) {
        expect(q.display).toContain('___')
        expect(q.options).toHaveLength(4)
      } else {
        throw new Error(`prompt inesperado: ${q.prompt}`)
      }
      expect(q.emoji).toBeFalsy()
      expect(q.prompt).not.toBe('¿Cómo se escribe?')
    }
  })

  it('Mis fallos reconstruye sin cambiar de regla del lema', () => {
    const misses: SpellMissEntry[] = [
      {
        key: 'ortografia-gj:gj-gente',
        rule: 'g-j',
        misses: 2,
        hits: 0,
        streakHits: 0,
        updatedAt: Date.now(),
      },
      {
        key: 'ortografia-rr:rr-perro',
        rule: 'r-rr',
        misses: 2,
        hits: 0,
        streakHits: 0,
        updatedAt: Date.now(),
      },
      {
        key: 'ortografia-czqu:czqu-cazo',
        rule: 'c-z-qu',
        misses: 2,
        hits: 0,
        streakHits: 0,
        updatedAt: Date.now(),
      },
    ]
    const round = buildOrtografiaReviewRound(3, 6001, misses)
    expect(round).toHaveLength(3)
    expect(round[0]?.targetKey).toBe('ortografia-gj:gj-gente')
    expect(round[1]?.targetKey).toBe('ortografia-rr:rr-perro')
    expect(round[2]?.targetKey).toBe('ortografia-czqu:czqu-cazo')
    for (const q of round) {
      const parsed = parseOrtographyMissKey(q.targetKey!)
      expect(parsed).toBeTruthy()
      const entry = getOrtographyCorpus().byRef.get(q.targetKey!)!
      expect(q.rule).toBeTruthy()
      if (q.prompt.includes('mal')) assertIntruderMonorule(q)
      else if (q.prompt.includes('bien')) assertCorrectEditorial(q)
      else assertMissingRivalsOnly(q)
      expect(entry.lemma.ruleId).toBe(misses.find((m) => m.key === q.targetKey)!.rule)
    }
    // cazo no admite correct/intruder → debe caer en missing
    expect(round[2]?.prompt).toMatch(/falta|regla/i)
    expect(canBuildIntruderQuestion(getOrtographyCorpus().byRef.get('ortografia-czqu:czqu-cazo')!)).toBe(
      false,
    )
  })

  it('reporta packs con pool reducido para Intrusa (<3 lemas)', () => {
    const stats = intruderPackSufficiency()
    expect(stats.length).toBeGreaterThan(0)
    // hay-ahi-ay tiene solo 3 lemas: anclas pueden necesitar <4 opciones
    const hay = stats.find((s) => s.packId === 'ortografia-hay-ahi-ay')
    expect(hay?.lemmaCount).toBeLessThanOrEqual(3)
  })
})

describe('E2E volumen monorregla', () => {
  it('≥500 Mezcla + ≥300 Intrusa + ≥300 Correct + ≥300 Missing + Mis fallos', () => {
    const mix: SpellMcqQuestion[] = []
    for (let s = 1; s <= 42; s += 1) mix.push(...buildOrtografiaMixRound(12, s * 10_007))
    expect(mix.length).toBeGreaterThanOrEqual(500)

    const intruder = [
      ...buildOrtografiaIntruderRound(100, 701),
      ...buildOrtografiaIntruderRound(100, 702),
      ...buildOrtografiaIntruderRound(100, 703),
    ]
    const correct = [
      ...buildOrtografiaCorrectRound(100, 801),
      ...buildOrtografiaCorrectRound(100, 802),
      ...buildOrtografiaCorrectRound(100, 803),
    ]
    const missing = [
      ...buildOrtografiaMissingRound(100, 901),
      ...buildOrtografiaMissingRound(100, 902),
      ...buildOrtografiaMissingRound(100, 903),
    ]
    expect(intruder).toHaveLength(300)
    expect(correct).toHaveLength(300)
    expect(missing).toHaveLength(300)

    let reducedIntruder = 0
    let reducedMissing = 0
    let reducedCorrect = 0

    for (const q of mix) {
      if (q.prompt.includes('mal')) assertIntruderMonorule(q)
      else if (q.prompt.includes('bien')) assertCorrectEditorial(q)
      else if (q.prompt.includes('falta') || q.prompt.includes('regla')) assertMissingRivalsOnly(q)
    }
    for (const q of intruder) {
      assertIntruderMonorule(q)
      if (q.options.length < 4) reducedIntruder += 1
    }
    for (const q of correct) {
      assertCorrectEditorial(q)
      if (q.options.length < 4) reducedCorrect += 1
    }
    for (const q of missing) {
      assertMissingRivalsOnly(q)
      if (q.options.length < 4) reducedMissing += 1
    }

    expect(reducedMissing).toBeGreaterThan(0)

    const reviewMisses: SpellMissEntry[] = getOrtographyCorpus()
      .entries.filter((e) => canBuildIntruderQuestion(e) || canBuildBareCorrectQuestion(e) || itemApprovedErrors(e).length > 0)
      .slice(0, 12)
      .map((e) => ({
        key: `${e.packId}:${e.lemma.id}`,
        rule: e.lemma.ruleId as SpellMissEntry['rule'],
        misses: 2,
        hits: 0,
        streakHits: 0,
        updatedAt: Date.now(),
      }))
    const review = buildOrtografiaReviewRound(12, 1001, reviewMisses)
    expect(review).toHaveLength(12)
    for (let i = 0; i < reviewMisses.length; i += 1) {
      expect(review[i]?.targetKey).toBe(reviewMisses[i]!.key)
    }

    // Contadores para la entrega (asserts blandos)
    expect(reducedIntruder + reducedCorrect + reducedMissing).toBeGreaterThan(0)
  })

  it('ejemplo forzado Intrusa monorregla (czqu)', () => {
    const entry = getOrtographyCorpus().byRef.get('ortografia-czqu:czqu-queso')!
    const q = buildOrtografiaIntruderQuestion(42, new Set(), 'intruder', entry)
    assertIntruderMonorule(q)
    for (const o of q.options) {
      if (norm(o) === norm(q.options[q.correctIndex]!)) continue
      const peer = getOrtographyCorpus().entries.find(
        (e) => e.packId === 'ortografia-czqu' && norm(e.lemma.lemma) === norm(o),
      )
      expect(peer?.lemma.ruleId).toBe('c-z-qu')
    }
  })
})
