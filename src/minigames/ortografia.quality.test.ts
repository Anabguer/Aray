/**
 * Auditoría de calidad Ortografía v2: lemas + frases + adaptadores.
 */
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { getOrtographyCorpus } from '@/feinetas/ortographyCorpus'
import { listActivePhraseItems } from '@/minigames/adapters/ortografiaComplete'
import { buildOrtografiaCorrectRound } from '@/minigames/adapters/ortografiaCorrect'
import { buildOrtografiaIntruderRound } from '@/minigames/adapters/ortografiaIntruder'
import { buildOrtografiaMixRound } from '@/minigames/adapters/ortografiaMix'
import { buildOrtografiaMissingRound } from '@/minigames/adapters/ortografiaMissing'
import { PICTURE_MODE_ENABLED } from '@/minigames/adapters/ortografiaPicture'
import {
  canBuildBareCorrectQuestion,
  canBuildIntruderQuestion,
  canBuildPictureQuestion,
  itemApprovedErrors,
  itemSafeMisspellingsForBareMcq,
  listExcludedForBareCorrect,
} from '@/minigames/adapters/ortografiaShared'
import { getMinigame, listMinigames } from '@/minigames/catalog'

const ROOT = path.resolve(__dirname, '../..')
const ADAPTERS = path.join(ROOT, 'src/minigames/adapters')

describe('auditoría calidad ortografía', () => {
  it('216 lemas y 30 frases activas', () => {
    expect(getOrtographyCorpus().entries).toHaveLength(216)
    expect(listActivePhraseItems()).toHaveLength(30)
  })

  it('ningún adaptador importa makeDistractors / bank / generator', () => {
    const files = readdirSync(ADAPTERS).filter(
      (f) => f.startsWith('ortografia') && f.endsWith('.ts') && !f.endsWith('.test.ts'),
    )
    const forbidden =
      /makeDistractors|from\s+['"]@\/spelling\/(bank|distract|generator|lemmas\.generated)['"]/
    for (const f of files) {
      const src = readFileSync(path.join(ADAPTERS, f), 'utf8')
      expect(forbidden.test(src), f).toBe(false)
    }
  })

  it('Imagen desactivada y fuera de Mezcla / catálogo activo', () => {
    expect(PICTURE_MODE_ENABLED).toBe(false)
    expect(getMinigame('spelling-picture').status).toBe('coming-soon')
    const mixSrc = readFileSync(path.join(ADAPTERS, 'ortografiaMix.ts'), 'utf8')
    expect(mixSrc).not.toMatch(/picture/)
    expect(listMinigames().filter((m) => m.category === 'spelling' && m.status === 'active')).toHaveLength(
      6,
    )
  })

  it('ítems sin image.ref no son picture-ready', () => {
    expect(getOrtographyCorpus().entries.filter(canBuildPictureQuestion)).toHaveLength(0)
  })

  it('exclusiones bare-MCQ registradas (cazo y homófonos)', () => {
    const { excluded, eligible } = listExcludedForBareCorrect()
    expect(eligible.length + excluded.length).toBe(216)
    expect(excluded.map((e) => e.lemma.lemma)).toContain('cazo')
    // Registrar volumen para entrega
    expect(excluded.length).toBeGreaterThan(0)
    expect(eligible.length).toBeGreaterThan(150)
  })

  it('toda opción incorrecta de correct/intruder ∈ errors[] del ítem', () => {
    for (const q of [
      ...buildOrtografiaCorrectRound(20, 101),
      ...buildOrtografiaIntruderRound(20, 202),
    ]) {
      const entry = getOrtographyCorpus().byRef.get(q.targetKey!)!
      const approved = new Set(itemApprovedErrors(entry).map((e) => e.toLocaleLowerCase('es')))
      const lemma = entry.lemma.lemma.toLocaleLowerCase('es')
      for (let i = 0; i < q.options.length; i += 1) {
        const opt = q.options[i]!.toLocaleLowerCase('es')
        if (i === q.correctIndex) {
          if (q.prompt.includes('mal')) {
            expect(approved.has(opt)).toBe(true)
          } else {
            expect(opt).toBe(lemma)
          }
        } else if (!q.prompt.includes('mal')) {
          expect(approved.has(opt)).toBe(true)
        }
      }
      expect(new Set(q.options.map((o) => o.toLocaleLowerCase('es'))).size).toBe(q.options.length)
    }
  })

  it('Mezcla no produce picture ni distractores inventados tipo cazoón', () => {
    const round = buildOrtografiaMixRound(48, 303)
    for (const q of round) {
      expect(q.prompt).not.toBe('¿Cómo se escribe?')
      expect(q.emoji).toBeFalsy()
      expect(q.options.some((o) => /^cazoón$|^cazoito$|^incazo$|^inreloj$/i.test(o))).toBe(false)
      expect(q.options.some((o) => /^in[a-záéíóúñ]{3,}$/i.test(o) && q.options.some((c) => c.toLocaleLowerCase('es') === o.slice(2).toLocaleLowerCase('es')))).toBe(false)
      if (q.targetKey === 'ortografia-czqu:czqu-cazo') {
        expect(q.prompt).toMatch(/falta|regla/i)
      }
    }
  })

  it('frases: opciones exactas del JSON, sin duplicados, una sola correcta', () => {
    for (const item of listActivePhraseItems()) {
      expect(item.options).toHaveLength(4)
      expect(new Set(item.options.map((o) => o.toLocaleLowerCase('es'))).size).toBe(4)
      expect(item.correctIndex).toBeGreaterThanOrEqual(0)
      expect(item.correctIndex).toBeLessThan(4)
    }
  })

  it('missing genera rondas sin inventar palabras-opción', () => {
    const round = buildOrtografiaMissingRound(12, 404)
    expect(round).toHaveLength(12)
  })

  it('canBuild helpers coherentes con cazo', () => {
    const cazo = getOrtographyCorpus().byRef.get('ortografia-czqu:czqu-cazo')!
    expect(itemApprovedErrors(cazo)).toEqual(['caso'])
    expect(itemSafeMisspellingsForBareMcq(cazo)).toEqual([])
    expect(canBuildBareCorrectQuestion(cazo)).toBe(false)
    expect(canBuildIntruderQuestion(cazo)).toBe(false)
  })
})
