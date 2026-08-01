import { describe, expect, it } from 'vitest'
import { buildFormarPalabrasRound } from '@/feinetas'
import {
  buildRound,
  getMechanic,
  getMinigame,
  hasMinigame,
  listMechanics,
  listMinigames,
  minigamesForCategory,
  spellingMinigameId,
} from '@/minigames'
import { SPELL_MODE_LABELS, type SpellPlayMode } from '@/spelling/types'

const SPELL_MODES: SpellPlayMode[] = [
  'missing',
  'correct',
  'intruder',
  'complete',
  'mix',
  'review',
]

describe('minigames Fase 4 (Ortografía 100% packs)', () => {
  it('todos los modos spelling activos son pack (Imagen coming-soon)', () => {
    expect(listMinigames().length).toBeGreaterThanOrEqual(8)
    expect(hasMinigame('formar-palabras')).toBe(true)

    for (const mode of SPELL_MODES) {
      const game = getMinigame(spellingMinigameId(mode))
      expect(game.source).toBe('pack')
      expect(game.mechanicId).toBe('ortografia-lemma-mcq')
      expect(game.packIds.length).toBeGreaterThan(0)
      expect(game.title).toBe(SPELL_MODE_LABELS[mode])
      expect(game.status).toBe('active')
    }

    expect(getMinigame('spelling-picture').status).toBe('coming-soon')
    expect(getMinigame('spelling-complete').packIds).toEqual([
      'ortografia-frases-completar',
    ])
    expect(minigamesForCategory('spelling')).toHaveLength(6)
  })

  it('no registra legacy-spell', () => {
    const ids = listMechanics().map((m) => m.id).sort()
    expect(ids).toEqual([
      'maths-legacy',
      'mcq',
      'ordenar-letras',
      'ortografia-lemma-mcq',
    ])
    expect(getMechanic('ortografia-lemma-mcq').temporaryLegacy).toBeFalsy()
    expect(getMechanic('maths-legacy').temporaryLegacy).toBe(true)
  })

  it('buildRound spelling-* activos genera MCQ válidas', () => {
    for (const mode of SPELL_MODES) {
      const via = buildRound(spellingMinigameId(mode), { count: 6, seed: 42_001 })
      expect(via.kind).toBe('spell-mcq')
      if (via.kind !== 'spell-mcq') return
      expect(via.questions).toHaveLength(6)
      for (const q of via.questions) {
        expect(q.options.length).toBeGreaterThanOrEqual(2)
        expect(q.options.length).toBeLessThanOrEqual(4)
        expect(q.targetKey).toBeTruthy()
        expect(q.targetKey?.startsWith('ctx:')).toBe(false)
      }
    }
  })

  it('buildRound(formar-palabras) sigue en pack', () => {
    let n = 0
    const random = () => {
      n += 1
      return (n * 0.37) % 1
    }
    let n2 = 0
    const random2 = () => {
      n2 += 1
      return (n2 * 0.37) % 1
    }
    const direct = buildFormarPalabrasRound(8, random)
    const via = buildRound('formar-palabras', { count: 8, random: random2 })
    expect(via.kind).toBe('ordenar-letras')
    if (via.kind !== 'ordenar-letras') return
    expect(via.items.map((r) => r.item.id)).toEqual(direct.items.map((r) => r.item.id))
  })
})
