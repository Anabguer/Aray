import { describe, expect, it } from 'vitest'
import { getOrtographyCorpus } from '@/feinetas/ortographyCorpus'
import { buildOrtografiaCorrectRound } from '@/minigames/adapters/ortografiaCorrect'
import { buildRound } from '@/minigames/buildRound'
import { getMinigame } from '@/minigames/catalog'

describe('ortografiaCorrect', () => {
  it('genera MCQ solo con lemma + errors atestiguados del corpus', () => {
    const corpus = getOrtographyCorpus()
    const attested = new Set<string>()
    for (const e of corpus.entries) {
      attested.add(e.lemma.lemma.toLocaleLowerCase('es'))
      for (const err of e.lemma.errors) attested.add(err.toLocaleLowerCase('es'))
    }

    const round = buildOrtografiaCorrectRound(12, 99_001)
    expect(round).toHaveLength(12)
    for (const q of round) {
      expect(q.prompt).toBe('¿Cuál está bien escrita?')
      expect(q.targetKey).toMatch(/^ortografia-/)
      expect(q.options).toHaveLength(4)
      expect(q.options[q.correctIndex]).toBeTruthy()
      for (const opt of q.options) {
        expect(attested.has(opt.toLocaleLowerCase('es'))).toBe(true)
      }
    }
  })

  it('buildRound(spelling-correct) usa packs JSON', () => {
    const game = getMinigame('spelling-correct')
    expect(game.source).toBe('pack')
    expect(game.mechanicId).toBe('ortografia-lemma-mcq')
    expect(game.packIds.length).toBe(10)

    const round = buildRound('spelling-correct', { count: 8, seed: 7 })
    expect(round.kind).toBe('spell-mcq')
    if (round.kind !== 'spell-mcq') return
    expect(round.questions).toHaveLength(8)
    expect(round.questions.every((q) => q.targetKey?.startsWith('ortografia-'))).toBe(true)
  })
})
