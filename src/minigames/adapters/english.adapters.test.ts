import { describe, expect, it } from 'vitest'
import { ENGLISH_PACK_IDS } from '@/feinetas/englishRegistry'
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
  it('runtime sin packs: corpus/adapters no construyen rondas', () => {
    expect(ENGLISH_PACK_IDS).toHaveLength(0)
    expect(canBuildEnglishIntruder('ingles-school')).toBe(false)
  })

  it('buildRound(english-*) exige packId y falla sin pack en registry', () => {
    for (const mode of MODES) {
      const id = englishMinigameId(mode)
      expect(getMinigame(id).mechanicId).toBe('english-lemma-mcq')
      expect(() => buildRound(id, { count: 4, seed: 9 })).toThrow(/packId/)
      expect(() =>
        buildRound(id, { count: 4, seed: 9, packId: 'ingles-school' }),
      ).toThrow(/Pack no registrado|pool|lemas|pack/i)
    }
  })
})
