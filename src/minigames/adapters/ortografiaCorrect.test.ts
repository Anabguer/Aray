import { describe, expect, it } from 'vitest'
import { getOrtographyCorpus } from '@/feinetas/ortographyCorpus'
import { buildOrtografiaCorrectQuestion, buildOrtografiaCorrectRound } from '@/minigames/adapters/ortografiaCorrect'
import {
  canBuildBareCorrectQuestion,
  itemApprovedErrors,
  itemSafeMisspellingsForBareMcq,
  listExcludedForBareCorrect,
} from '@/minigames/adapters/ortografiaShared'
import { buildRound } from '@/minigames/buildRound'
import { getMinigame } from '@/minigames/catalog'

describe('ortografiaCorrect', () => {
  it('opciones incorrectas ⊆ errors[] del propio ítem (sin relleno)', () => {
    const round = buildOrtografiaCorrectRound(24, 99_001)
    expect(round.length).toBe(24)
    for (const q of round) {
      expect(q.prompt).toBe('¿Cuál está bien escrita?')
      expect(q.targetKey).toMatch(/^ortografia-/)
      expect(q.options.length).toBeGreaterThanOrEqual(2)
      expect(q.options.length).toBeLessThanOrEqual(4)
      const entry = getOrtographyCorpus().byRef.get(q.targetKey!)
      expect(entry).toBeTruthy()
      const allowed = new Set(
        [entry!.lemma.lemma, ...itemSafeMisspellingsForBareMcq(entry!)].map((s) =>
          s.toLocaleLowerCase('es'),
        ),
      )
      for (const opt of q.options) {
        expect(allowed.has(opt.toLocaleLowerCase('es'))).toBe(true)
      }
      const wrongs = q.options.filter((_, i) => i !== q.correctIndex)
      for (const w of wrongs) {
        expect(itemApprovedErrors(entry!).map((e) => e.toLocaleLowerCase('es'))).toContain(
          w.toLocaleLowerCase('es'),
        )
      }
      expect(new Set(q.options.map((o) => o.toLocaleLowerCase('es'))).size).toBe(q.options.length)
    }
  })

  it('cazo queda fuera de Forma correcta (caso es palabra real ambigua)', () => {
    const cazo = getOrtographyCorpus().byRef.get('ortografia-czqu:czqu-cazo')!
    expect(canBuildBareCorrectQuestion(cazo)).toBe(false)
    expect(() => buildOrtografiaCorrectQuestion(1, new Set(), 'correct', cazo)).toThrow(/excluido/)
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

  it('lista exclusiones por falta de errores no ambiguos', () => {
    const { excluded, eligible } = listExcludedForBareCorrect()
    expect(eligible.length).toBeGreaterThan(100)
    expect(excluded.some((e) => e.lemma.lemma === 'cazo')).toBe(true)
  })
})
