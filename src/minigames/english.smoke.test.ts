import { describe, expect, it } from 'vitest'
import { visibleWorlds } from '@/curriculum'
import { createInitialProgress } from '@/progress/repository'
import { ENGLISH_HUB_PACK_IDS } from '@/feinetas/englishRegistry'
import { buildRound, englishMinigameId, getMinigame } from '@/minigames'
import type { EnglishPlayMode } from '@/english/types'

const PLAYABLE: EnglishPlayMode[] = [
  'meaning',
  'translate',
  'intruder',
  'missing',
  'mix',
]

describe('english smoke recorrido', () => {
  it('mundo Inglés queda jugable en Misiones', () => {
    const worlds = visibleWorlds(createInitialProgress())
    const eng = worlds.find((w) => w.id === 'english')
    expect(eng?.hasPlayable).toBe(true)
    expect(eng?.worldPath).toBe('/missions/english')
  })

  it('cada pack del hub × modo genera ronda english-mcq válida', () => {
    for (const packId of ENGLISH_HUB_PACK_IDS) {
      for (const mode of PLAYABLE) {
        const id = englishMinigameId(mode)
        expect(getMinigame(id).status).toBe('active')
        const round = buildRound(id, { count: 6, seed: 100 + packId.length, packId })
        expect(round.kind).toBe('english-mcq')
        if (round.kind !== 'english-mcq') continue
        expect(round.questions).toHaveLength(6)
        for (const q of round.questions) {
          expect(q.options.length).toBeGreaterThanOrEqual(2)
          expect(q.correctIndex).toBeGreaterThanOrEqual(0)
          expect(q.correctIndex).toBeLessThan(q.options.length)
          expect(q.targetKey.startsWith(`${packId}:`)).toBe(true)
        }
      }
    }
  })

  it('no registra modo imagen en catálogo', () => {
    expect(() => getMinigame('english-picture')).toThrow()
  })
})
