import { describe, expect, it } from 'vitest'
import { ENGLISH_PACK_IDS } from '@/feinetas/englishRegistry'
import { getEnglishCorpus } from '@/feinetas/englishCorpus'
import { buildRound, englishMinigameId, getMinigame } from '@/minigames'
import { canBuildEnglishIntruder } from '@/minigames/adapters/englishIntruder'
import { buildEnglishMeaningRound } from '@/minigames/adapters/englishMeaning'
import { buildEnglishTranslateRound } from '@/minigames/adapters/englishTranslate'
import { buildEnglishIntruderRound } from '@/minigames/adapters/englishIntruder'
import { buildEnglishMissingRound } from '@/minigames/adapters/englishMissing'
import { buildEnglishMixRound } from '@/minigames/adapters/englishMix'
import type { EnglishPlayMode } from '@/english/types'

const MODES: EnglishPlayMode[] = [
  'meaning',
  'translate',
  'intruder',
  'missing',
  'mix',
]

function lemmaInPack(packId: string, text: string) {
  return getEnglishCorpus().entries.find(
    (e) =>
      e.packId === packId &&
      e.lemma.lemma.toLocaleLowerCase('en') === text.toLocaleLowerCase('en'),
  )
}

describe('english adapters', () => {
  for (const packId of ENGLISH_PACK_IDS) {
    it(`${packId}: meaning muestra lemma EN y opciones ES`, () => {
      const round = buildEnglishMeaningRound(packId, 8, 42_001)
      expect(round).toHaveLength(8)
      for (const q of round) {
        expect(q.prompt).toBe('¿Qué significa?')
        expect(q.options).toHaveLength(4)
        const entry = lemmaInPack(packId, q.display!)
        expect(entry).toBeTruthy()
        expect(q.options[q.correctIndex]).toBe(entry!.lemma.glossEs)
        expect(q.targetKey).toBe(`${packId}:${entry!.lemma.id}`)
      }
    })

    it(`${packId}: translate muestra glosa ES y opciones EN`, () => {
      const round = buildEnglishTranslateRound(packId, 8, 42_002)
      for (const q of round) {
        expect(q.prompt).toBe('¿Cómo se dice?')
        const entry = getEnglishCorpus().entries.find(
          (e) => e.packId === packId && e.lemma.glossEs === q.display,
        )
        expect(entry).toBeTruthy()
        expect(q.options[q.correctIndex]).toBe(entry!.lemma.lemma)
      }
    })

    it(`${packId}: intrusa 3+1 del mismo pack`, () => {
      expect(canBuildEnglishIntruder(packId)).toBe(true)
      const round = buildEnglishIntruderRound(packId, 6, 42_003)
      for (const q of round) {
        expect(q.options).toHaveLength(4)
        expect(q.prompt).toBe('¿Cuál no encaja?')
        const cats = q.options.map(
          (opt) => lemmaInPack(packId, opt)?.lemma.category,
        )
        expect(cats.every(Boolean)).toBe(true)
        const counts = new Map<string, number>()
        for (const c of cats) counts.set(c!, (counts.get(c!) ?? 0) + 1)
        const values = [...counts.values()].sort((a, b) => b - a)
        expect(values[0]).toBe(3)
        expect(values[1]).toBe(1)
      }
    })

    it(`${packId}: missing tiene hueco y tip con glosa`, () => {
      const round = buildEnglishMissingRound(packId, 6, 42_004)
      for (const q of round) {
        expect(q.display).toMatch(/_/)
        expect(q.options).toHaveLength(4)
        expect(q.tip).toBeTruthy()
      }
    })

    it(`${packId}: mix solo modos base`, () => {
      const round = buildEnglishMixRound(packId, 12, 42_005)
      expect(round).toHaveLength(12)
      for (const q of round) {
        expect(['meaning', 'translate', 'intruder', 'missing']).toContain(
          q.sourceMode,
        )
        expect(q.mode).toBe('mix')
      }
    })
  }

  it('buildRound(english-*) exige packId y produce english-mcq', () => {
    for (const mode of MODES) {
      const id = englishMinigameId(mode)
      expect(getMinigame(id).mechanicId).toBe('english-lemma-mcq')
      expect(() => buildRound(id, { count: 4, seed: 9 })).toThrow(/packId/)
      const round = buildRound(id, {
        count: 4,
        seed: 9,
        packId: 'ingles-school',
      })
      expect(round.kind).toBe('english-mcq')
      if (round.kind !== 'english-mcq') return
      expect(round.questions).toHaveLength(4)
      expect(
        round.questions.every((q) => q.targetKey.startsWith('ingles-')),
      ).toBe(true)
    }
  })
})
