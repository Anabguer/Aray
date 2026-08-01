/**
 * Validación E2E de volumen: Ortografía productiva post-hotfix Imagen.
 */
import { describe, expect, it } from 'vitest'
import { getOrtographyCorpus } from '@/feinetas/ortographyCorpus'
import {
  buildOrtografiaCompleteRound,
  getOrtographyPhrasesPack,
  listActivePhraseItems,
} from '@/minigames/adapters/ortografiaComplete'
import { buildOrtografiaCorrectRound } from '@/minigames/adapters/ortografiaCorrect'
import { buildOrtografiaIntruderRound } from '@/minigames/adapters/ortografiaIntruder'
import { buildOrtografiaMissingRound } from '@/minigames/adapters/ortografiaMissing'
import { buildOrtografiaMixRound } from '@/minigames/adapters/ortografiaMix'
import { buildOrtografiaReviewRound } from '@/minigames/adapters/ortografiaReview'
import {
  canBuildBareCorrectQuestion,
  canBuildIntruderQuestion,
  itemApprovedErrors,
  listExcludedForBareCorrect,
} from '@/minigames/adapters/ortografiaShared'
import { PICTURE_MODE_ENABLED } from '@/minigames/adapters/ortografiaPicture'
import { buildRound } from '@/minigames/buildRound'
import type { SpellMissEntry } from '@/spelling/missStore'
import type { SpellQuestion } from '@/spelling/types'

const EXCLUDED_LEMMAS = new Set(listExcludedForBareCorrect().excluded.map((e) => e.lemma.lemma))

function assertNoPicture(q: SpellQuestion) {
  expect(q.prompt).not.toBe('¿Cómo se escribe?')
  expect(q.emoji).toBeFalsy()
  expect(q.id.startsWith('pic-')).toBe(false)
}

function assertNoInventedWordPads(opts: string[], lemma?: string) {
  for (const o of opts) {
    expect(o).not.toMatch(/^cazoón$/i)
    if (lemma) {
      const base = lemma.normalize('NFD').replace(/\u0301/g, '')
      expect(o.toLocaleLowerCase('es')).not.toBe(`${base}ón`.toLocaleLowerCase('es'))
      expect(o.toLocaleLowerCase('es')).not.toBe(`${base}ito`.toLocaleLowerCase('es'))
      expect(o.toLocaleLowerCase('es')).not.toBe(`re${base}`.toLocaleLowerCase('es'))
      expect(o.toLocaleLowerCase('es')).not.toBe(`in${base}`.toLocaleLowerCase('es'))
    }
  }
}

function assertCorrectOrIntruderEditorial(q: SpellQuestion) {
  assertNoPicture(q)
  expect(q.options.length).toBeGreaterThanOrEqual(2)
  expect(q.options.length).toBeLessThanOrEqual(4)
  expect(new Set(q.options.map((o) => o.toLocaleLowerCase('es'))).size).toBe(q.options.length)
  expect(q.correctIndex).toBeGreaterThanOrEqual(0)
  expect(q.correctIndex).toBeLessThan(q.options.length)

  const entry = getOrtographyCorpus().byRef.get(q.targetKey!)
  expect(entry).toBeTruthy()
  const approved = new Set(itemApprovedErrors(entry!).map((e) => e.toLocaleLowerCase('es')))
  const lemma = entry!.lemma.lemma.toLocaleLowerCase('es')
  assertNoInventedWordPads(q.options, entry!.lemma.lemma)

  if (q.prompt.includes('mal')) {
    // Intrusa: la correcta es un error editorial; el resto son lemas del corpus
    const wrong = q.options[q.correctIndex]!.toLocaleLowerCase('es')
    expect(approved.has(wrong)).toBe(true)
    expect(EXCLUDED_LEMMAS.has(entry!.lemma.lemma)).toBe(false)
  } else {
    expect(q.options[q.correctIndex]!.toLocaleLowerCase('es')).toBe(lemma)
    expect(EXCLUDED_LEMMAS.has(entry!.lemma.lemma)).toBe(false)
    for (let i = 0; i < q.options.length; i += 1) {
      if (i === q.correctIndex) continue
      expect(approved.has(q.options[i]!.toLocaleLowerCase('es'))).toBe(true)
    }
  }
}

describe('E2E volumen Ortografía (cierre)', () => {
  it('PICTURE_MODE_ENABLED false', () => {
    expect(PICTURE_MODE_ENABLED).toBe(false)
  })

  it('≥500 preguntas Mezcla: sin Imagen, sin inventos, sin bloqueo', () => {
    const questions: SpellQuestion[] = []
    for (let seed = 1; seed <= 42; seed += 1) {
      questions.push(...buildOrtografiaMixRound(12, seed * 10_007))
    }
    expect(questions.length).toBeGreaterThanOrEqual(500)

    let complete = 0
    let correct = 0
    let intruder = 0
    let missing = 0
    for (const q of questions) {
      assertNoPicture(q)
      expect(q.options.length).toBeGreaterThanOrEqual(2)
      expect(q.options.length).toBeLessThanOrEqual(4)
      expect(q.targetKey).toBeTruthy()
      assertNoInventedWordPads(q.options)

      if (q.prompt.includes('frase')) complete += 1
      else if (q.prompt.includes('mal')) {
        intruder += 1
        assertCorrectOrIntruderEditorial(q)
      } else if (q.prompt.includes('bien')) {
        correct += 1
        assertCorrectOrIntruderEditorial(q)
      } else if (q.prompt.includes('falta') || q.prompt.includes('regla')) {
        missing += 1
        expect(q.display).toBeTruthy()
      } else {
        throw new Error(`Prompt inesperado en mezcla: ${q.prompt}`)
      }
    }
    expect(complete).toBeGreaterThan(0)
    expect(correct).toBeGreaterThan(0)
    expect(intruder).toBeGreaterThan(0)
    expect(missing).toBeGreaterThan(0)
  })

  it('≥200 Forma correcta: solo elegibles, opciones ⊆ errors[]', () => {
    const questions = [
      ...buildOrtografiaCorrectRound(100, 501),
      ...buildOrtografiaCorrectRound(100, 502),
    ]
    expect(questions).toHaveLength(200)
    const counts = { 2: 0, 3: 0, 4: 0 }
    for (const q of questions) {
      assertCorrectOrIntruderEditorial(q)
      counts[q.options.length as 2 | 3 | 4] += 1
    }
    expect(counts[2] + counts[3] + counts[4]).toBe(200)
    expect(counts[2]).toBeGreaterThan(0)
  })

  it('≥200 Intrusa: excluidos fuera; intrusa ∈ errors[]', () => {
    const questions = [
      ...buildOrtografiaIntruderRound(100, 601),
      ...buildOrtografiaIntruderRound(100, 602),
    ]
    expect(questions).toHaveLength(200)
    for (const q of questions) assertCorrectOrIntruderEditorial(q)
  })

  it('≥200 Letra de la regla: excluidos pueden aparecer', () => {
    const questions = [
      ...buildOrtografiaMissingRound(100, 701),
      ...buildOrtografiaMissingRound(100, 702),
    ]
    expect(questions).toHaveLength(200)
    let excludedSeen = 0
    for (const q of questions) {
      assertNoPicture(q)
      expect(q.options).toHaveLength(4)
      const entry = getOrtographyCorpus().byRef.get(q.targetKey!)
      if (entry && EXCLUDED_LEMMAS.has(entry.lemma.lemma)) excludedSeen += 1
    }
    // Con 200 preguntas es muy probable ver alguno; si no, forzar muestreo amplio
    if (excludedSeen === 0) {
      const forced = [...EXCLUDED_LEMMAS].slice(0, 3)
      for (const lemma of forced) {
        const entry = getOrtographyCorpus().entries.find((e) => e.lemma.lemma === lemma)!
        expect(canBuildBareCorrectQuestion(entry)).toBe(false)
        expect(itemApprovedErrors(entry).length).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('30 frases completas: pack editorial intacto', () => {
    const pack = getOrtographyPhrasesPack()
    const items = listActivePhraseItems()
    expect(items).toHaveLength(30)
    const round = buildOrtografiaCompleteRound(30, 801)
    expect(round).toHaveLength(30)
    const seen = new Set<string>()
    for (const q of round) {
      assertNoPicture(q)
      expect(q.options).toHaveLength(4)
      expect(q.display).toContain('___')
      const id = q.targetKey!.split(':').slice(1).join(':')
      seen.add(id)
      const item = items.find((i) => i.id === id)!
      const allowed = new Set(item.options.map((o) => o.toLocaleLowerCase('es')))
      for (const o of q.options) expect(allowed.has(o.toLocaleLowerCase('es'))).toBe(true)
    }
    expect(seen.size).toBe(30)
    expect(pack.pack.id).toBe('ortografia-frases-completar')
  })

  it('Mis fallos: claves válidas, huérfanas y era-Imagen no bloquean ni abren picture', () => {
    const misses: SpellMissEntry[] = [
      {
        key: 'ortografia-rr:rr-perro',
        rule: 'r-rr',
        misses: 3,
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
      {
        key: 'ortografia-frases-completar:frase-hay-01',
        rule: 'hay-ahi-ay',
        misses: 1,
        hits: 0,
        streakHits: 0,
        updatedAt: Date.now(),
      },
      {
        key: 'ctx:old-picture-1',
        rule: 'c-z-qu',
        misses: 9,
        hits: 0,
        streakHits: 0,
        updatedAt: Date.now(),
      },
      {
        key: 'ortografia-ghost:no-existe',
        rule: 'tilde',
        misses: 4,
        hits: 0,
        streakHits: 0,
        updatedAt: Date.now(),
      },
      {
        key: 'perro',
        rule: 'r-rr',
        misses: 2,
        hits: 0,
        streakHits: 0,
        updatedAt: Date.now(),
      },
    ]

    const round = buildOrtografiaReviewRound(12, 901, misses)
    expect(round).toHaveLength(12)
    for (const q of round) {
      assertNoPicture(q)
      expect(q.mode).toBe('review')
      expect(q.options.length).toBeGreaterThanOrEqual(2)
    }
    // cazo (era imagen / excluido bare) → missing u otra mecánica válida, nunca picture
    const cazoQ = round.find((q) => q.targetKey === 'ortografia-czqu:czqu-cazo')
    if (cazoQ) {
      expect(cazoQ.prompt).not.toBe('¿Cómo se escribe?')
      expect(cazoQ.prompt).not.toBe('¿Cuál está bien escrita?')
      expect(cazoQ.prompt).not.toBe('¿Cuál está mal escrita?')
    }

    expect(() => buildRound('spelling-review', { count: 8, seed: 44, preferMisses: misses })).not.toThrow()
    expect(() => buildRound('spelling-picture', { count: 4, seed: 1 })).toThrow(/Imagen/)
  })

  it('buildRound modos activos no lanzan en semillas sucesivas', () => {
    const modes = ['mix', 'correct', 'intruder', 'missing', 'complete', 'review'] as const
    for (const mode of modes) {
      for (let s = 0; s < 5; s += 1) {
        const r = buildRound(`spelling-${mode}`, { count: 12, seed: 1000 + s * 17 })
        expect(r.kind).toBe('spell-mcq')
        if (r.kind !== 'spell-mcq') continue
        expect(r.questions).toHaveLength(12)
        for (const q of r.questions) assertNoPicture(q)
      }
    }
  })

  it('intrusa/correcta: canBuild helpers alineados con exclusiones', () => {
    for (const e of getOrtographyCorpus().entries) {
      if (EXCLUDED_LEMMAS.has(e.lemma.lemma)) {
        expect(canBuildBareCorrectQuestion(e)).toBe(false)
        expect(canBuildIntruderQuestion(e)).toBe(false)
      }
    }
  })
})
