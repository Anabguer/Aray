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

describe('english smoke (mundo aparcado)', () => {
  it('mundo Inglés visible pero no jugable (próximamente)', () => {
    const worlds = visibleWorlds(createInitialProgress())
    const eng = worlds.find((w) => w.id === 'english')
    expect(eng?.hasPlayable).toBe(false)
    expect(eng?.status).toBe('future')
    expect(eng?.worldPath).toBe('/missions/english')
  })

  it('packs hub siguen en disco (contenido catalogado)', () => {
    expect(ENGLISH_HUB_PACK_IDS).toHaveLength(16)
  })

  it('minijuegos english-* siguen registrados para cuando se reabra', () => {
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
