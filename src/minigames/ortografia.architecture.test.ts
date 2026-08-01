/**
 * Test de arquitectura Fase 4: Ortografía sin legacy de frases ni bank en adaptadores JSON.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { getMinigame, listMinigames } from '@/minigames/catalog'
import type { SpellPlayMode } from '@/spelling/types'

const ROOT = path.resolve(__dirname, '../..')
const ADAPTERS_DIR = path.join(ROOT, 'src/minigames/adapters')
const FEINETAS_DIR = path.join(ROOT, 'src/feinetas')

const JSON_ADAPTER_FILES = [
  'ortografiaCorrect.ts',
  'ortografiaIntruder.ts',
  'ortografiaMissing.ts',
  'ortografiaPicture.ts',
  'ortografiaMix.ts',
  'ortografiaReview.ts',
  'ortografiaShared.ts',
  'ortografiaComplete.ts',
]

const FORBIDDEN_IMPORT_RE =
  /from\s+['"]@\/spelling\/(bank|distract|generator|lemmas\.generated|legacyComplete)['"]/
const FORBIDDEN_SYMBOL_RE = /\b(SPELL_BANK|makeDistractors|SPELL_CONTEXTS)\b/

function readSrc(filePath: string): string {
  return readFileSync(filePath, 'utf8')
}

function assertNoLegacyDeps(label: string, src: string) {
  expect(FORBIDDEN_IMPORT_RE.test(src), `${label}: import legacy`).toBe(false)
  expect(FORBIDDEN_SYMBOL_RE.test(src), `${label}: símbolo legacy`).toBe(false)
}

describe('arquitectura ortografía JSON (Fase 4)', () => {
  it('adaptadores JSON no importan bank / distract / generator / contexts', () => {
    for (const name of JSON_ADAPTER_FILES) {
      assertNoLegacyDeps(name, readSrc(path.join(ADAPTERS_DIR, name)))
    }
    assertNoLegacyDeps(
      'ortographyCorpus.ts',
      readSrc(path.join(FEINETAS_DIR, 'ortographyCorpus.ts')),
    )
  })

  it('legacyComplete y legacySpell ya no existen', () => {
    expect(existsSync(path.join(ROOT, 'src/spelling/legacyComplete.ts'))).toBe(false)
    expect(existsSync(path.join(ROOT, 'src/minigames/adapters/legacySpell.ts'))).toBe(false)
  })

  it('SPELL_CONTEXTS ya no existe en types', () => {
    const typesSrc = readSrc(path.join(ROOT, 'src/spelling/types.ts'))
    expect(typesSrc).not.toMatch(/\bSPELL_CONTEXTS\b/)
    expect(typesSrc).not.toMatch(/\bSpellContext\b/)
  })

  it('catalog: ningún spelling es legacy', () => {
    const spelling = listMinigames().filter((m) => m.category === 'spelling')
    expect(spelling.every((m) => m.source === 'pack')).toBe(true)
    expect(spelling.every((m) => m.mechanicId === 'ortografia-lemma-mcq')).toBe(true)
    expect(getMinigame('spelling-complete').packIds).toContain(
      'ortografia-frases-completar',
    )

    const modes: SpellPlayMode[] = [
      'correct',
      'missing',
      'picture',
      'intruder',
      'complete',
      'mix',
      'review',
    ]
    for (const mode of modes) {
      expect(getMinigame(`spelling-${mode}`).source).toBe('pack')
    }
  })

  it('ningún adaptador ortografia*.ts importa generator ni bank', () => {
    const files = readdirSync(ADAPTERS_DIR).filter(
      (f) => f.startsWith('ortografia') && f.endsWith('.ts') && !f.endsWith('.test.ts'),
    )
    for (const f of files) {
      assertNoLegacyDeps(f, readSrc(path.join(ADAPTERS_DIR, f)))
    }
  })
})
