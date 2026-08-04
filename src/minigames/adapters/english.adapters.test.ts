import { describe, expect, it } from 'vitest'
import { ENGLISH_HUB_PACK_IDS, ENGLISH_PACK_IDS } from '@/feinetas/englishRegistry'
import { buildRound, englishMinigameId, getMinigame } from '@/minigames'
import { canBuildEnglishIntruder } from '@/minigames/adapters/englishIntruder'
import type { EnglishPlayMode } from '@/english/types'

const MODES: EnglishPlayMode[] = [
  'meaning',
  'translate',
  'intruder',
  'missing',
  'mix',
]

describe('english adapters', () => {
  it('runtime con packs de tandas 1–2', () => {
    expect(ENGLISH_PACK_IDS).toHaveLength(16)
    expect(canBuildEnglishIntruder('ingles-food')).toBe(true)
    expect(canBuildEnglishIntruder('ingles-places')).toBe(true)
  })

  it('buildRound(english-*) exige packId', () => {
    for (const mode of MODES) {
      const id = englishMinigameId(mode)
      expect(getMinigame(id).mechanicId).toBe('english-lemma-mcq')
      expect(() => buildRound(id, { count: 4, seed: 9 })).toThrow(/packId/)
    }
  })

  it('buildRound construye MCQ para cada pack del hub', () => {
    for (const packId of ENGLISH_HUB_PACK_IDS) {
      for (const mode of MODES) {
        if (mode === 'intruder' && !canBuildEnglishIntruder(packId)) continue
        const round = buildRound(englishMinigameId(mode), {
          count: 4,
          seed: 42,
          packId,
        })
        expect(round.kind).toBe('english-mcq')
        if (round.kind === 'english-mcq') {
          expect(round.questions).toHaveLength(4)
          expect(round.questions[0]?.options.length).toBeGreaterThanOrEqual(2)
        }
      }
    }
  })
})
