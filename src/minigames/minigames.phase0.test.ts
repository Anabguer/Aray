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
import { buildSpellRound } from '@/spelling/generator'
import { SPELL_MODE_LABELS, type SpellPlayMode } from '@/spelling/types'

const SPELL_MODES: SpellPlayMode[] = [
  'missing',
  'correct',
  'picture',
  'intruder',
  'complete',
  'mix',
  'review',
]

const STILL_LEGACY: SpellPlayMode[] = SPELL_MODES.filter((m) => m !== 'correct')

describe('minigames Fase 3 (cableado incremental)', () => {
  it('carga el catálogo con correct=JSON y resto legacy temporal', () => {
    const all = listMinigames()
    expect(all.length).toBeGreaterThanOrEqual(8)
    expect(hasMinigame('formar-palabras')).toBe(true)

    const correct = getMinigame('spelling-correct')
    expect(correct.source).toBe('pack')
    expect(correct.mechanicId).toBe('ortografia-lemma-mcq')
    expect(correct.packIds).toHaveLength(10)
    expect(correct.title).toBe(SPELL_MODE_LABELS.correct)

    for (const mode of STILL_LEGACY) {
      const game = getMinigame(spellingMinigameId(mode))
      expect(game.source).toBe('legacy')
      expect(game.mechanicId).toBe('legacy-spell')
      expect(game.packIds).toEqual([])
    }

    expect(minigamesForCategory('spelling')).toHaveLength(7)
  })

  it('registra mecánicas incl. ortografia-lemma-mcq', () => {
    const ids = listMechanics().map((m) => m.id).sort()
    expect(ids).toEqual(['legacy-spell', 'mcq', 'ordenar-letras', 'ortografia-lemma-mcq'])
    expect(getMechanic('legacy-spell').temporaryLegacy).toBe(true)
    expect(getMechanic('ortografia-lemma-mcq').temporaryLegacy).toBeFalsy()
  })

  it('buildRound legacy sigue alineado con generator (modos no migrados)', () => {
    const seed = 42_001
    const count = 8
    for (const mode of STILL_LEGACY) {
      const legacy = buildSpellRound(mode, count, seed)
      const viaCatalog = buildRound(spellingMinigameId(mode), { count, seed })
      expect(viaCatalog.kind).toBe('spell-mcq')
      if (viaCatalog.kind !== 'spell-mcq') return
      expect(viaCatalog.questions).toEqual(legacy)
    }
  })

  it('buildRound(formar-palabras) coincide con el builder del pack JSON', () => {
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
    expect(via.meta.nombre).toBe(direct.meta.nombre)
    expect(via.items.map((r) => r.item.id)).toEqual(direct.items.map((r) => r.item.id))
  })
})
