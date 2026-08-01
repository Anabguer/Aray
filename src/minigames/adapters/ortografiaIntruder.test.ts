import { describe, expect, it } from 'vitest'
import { getOrtographyCorpus } from '@/feinetas/ortographyCorpus'
import { buildOrtografiaIntruderRound } from '@/minigames/adapters/ortografiaIntruder'
import { buildRound } from '@/minigames/buildRound'
import { getMinigame } from '@/minigames/catalog'

describe('ortografiaIntruder', () => {
  it('la correcta es un error atestiguado; el resto son lemas del corpus', () => {
    const corpus = getOrtographyCorpus()
    const lemmas = new Set(corpus.entries.map((e) => e.lemma.lemma.toLocaleLowerCase('es')))
    const errors = new Set(
      corpus.entries.flatMap((e) => e.lemma.errors.map((x) => x.toLocaleLowerCase('es'))),
    )

    const round = buildOrtografiaIntruderRound(10, 55_001)
    for (const q of round) {
      expect(q.prompt).toBe('¿Cuál está mal escrita?')
      const bad = q.options[q.correctIndex]!
      expect(errors.has(bad.toLocaleLowerCase('es'))).toBe(true)
      for (let i = 0; i < q.options.length; i += 1) {
        if (i === q.correctIndex) continue
        expect(lemmas.has(q.options[i]!.toLocaleLowerCase('es'))).toBe(true)
      }
    }
  })

  it('buildRound(spelling-intruder) usa packs', () => {
    expect(getMinigame('spelling-intruder').source).toBe('pack')
    const round = buildRound('spelling-intruder', { count: 6, seed: 3 })
    expect(round.kind).toBe('spell-mcq')
    if (round.kind !== 'spell-mcq') return
    expect(round.questions.every((q) => q.targetKey?.startsWith('ortografia-'))).toBe(true)
  })
})
