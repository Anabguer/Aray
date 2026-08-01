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

describe('minigames Fase 0', () => {
  it('carga el catálogo con Ortografía legacy + Formar palabras', () => {
    const all = listMinigames()
    expect(all.length).toBeGreaterThanOrEqual(8)
    expect(hasMinigame('formar-palabras')).toBe(true)
    expect(getMinigame('formar-palabras').category).toBe('words')
    expect(getMinigame('formar-palabras').mechanicId).toBe('ordenar-letras')
    expect(getMinigame('formar-palabras').source).toBe('pack')
    expect(getMinigame('formar-palabras').packIds).toEqual(['formar-palabras'])

    for (const mode of SPELL_MODES) {
      const id = spellingMinigameId(mode)
      expect(hasMinigame(id)).toBe(true)
      const game = getMinigame(id)
      expect(game.source).toBe('legacy')
      expect(game.mechanicId).toBe('legacy-spell')
      expect(game.legacySpellMode).toBe(mode)
      expect(game.title).toBe(SPELL_MODE_LABELS[mode])
      expect(game.packIds).toEqual([])
    }

    expect(minigamesForCategory('spelling')).toHaveLength(7)
    expect(minigamesForCategory('words').map((m) => m.id)).toEqual(['formar-palabras'])
  })

  it('registra las mecánicas genéricas y el adaptador legacy', () => {
    const ids = listMechanics().map((m) => m.id).sort()
    expect(ids).toEqual(['legacy-spell', 'mcq', 'ordenar-letras'])
    expect(getMechanic('legacy-spell').temporaryLegacy).toBe(true)
    expect(getMechanic('mcq').temporaryLegacy).toBeFalsy()
  })

  it('buildRound(spelling-*) delega 1:1 en el generator legacy', () => {
    const seed = 42_001
    const count = 8
    for (const mode of SPELL_MODES) {
      const legacy = buildSpellRound(mode, count, seed)
      const viaCatalog = buildRound(spellingMinigameId(mode), { count, seed })
      expect(viaCatalog.kind).toBe('spell-mcq')
      if (viaCatalog.kind !== 'spell-mcq') return
      expect(viaCatalog.questions).toEqual(legacy)
      expect(viaCatalog.minigameId).toBe(spellingMinigameId(mode))
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
    expect(via.meta.palabras.length).toBe(250)
    expect(via.items.map((r) => r.item.id)).toEqual(direct.items.map((r) => r.item.id))
    expect(via.items.map((r) => r.scrambled.join(''))).toEqual(
      direct.items.map((r) => r.scrambled.join('')),
    )
  })

  it('no registra packs de Ortografía migrados (Fase 0)', () => {
    for (const mode of SPELL_MODES) {
      expect(getMinigame(spellingMinigameId(mode)).packIds).toHaveLength(0)
      expect(getMinigame(spellingMinigameId(mode)).source).toBe('legacy')
    }
  })
})
