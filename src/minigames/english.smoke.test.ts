import { describe, expect, it } from 'vitest'
import { visibleWorlds } from '@/curriculum'
import { createInitialProgress } from '@/progress/repository'
import { ENGLISH_HUB_PACK_IDS } from '@/feinetas/englishRegistry'
import { englishMinigameId, getMinigame } from '@/minigames'
import type { EnglishPlayMode } from '@/english/types'

const PLAYABLE: EnglishPlayMode[] = [
  'meaning',
  'translate',
  'intruder',
  'missing',
  'mix',
]

describe('english smoke recorrido', () => {
  it('mundo Inglés accesible en Misiones', () => {
    const worlds = visibleWorlds(createInitialProgress())
    const eng = worlds.find((w) => w.id === 'english')
    expect(eng?.hasPlayable).toBe(true)
    expect(eng?.worldPath).toBe('/missions/english')
  })

  it('hub con 16 packs (tandas 1–2)', () => {
    expect(ENGLISH_HUB_PACK_IDS).toHaveLength(16)
  })

  it('minijuegos english-* activos con packs', () => {
    for (const mode of PLAYABLE) {
      const id = englishMinigameId(mode)
      expect(getMinigame(id).mechanicId).toBe('english-lemma-mcq')
      expect(getMinigame(id).status).toBe('active')
      expect(getMinigame(id).packIds).toHaveLength(16)
    }
  })

  it('no registra modo imagen en catálogo', () => {
    expect(() => getMinigame('english-picture')).toThrow()
  })
})
