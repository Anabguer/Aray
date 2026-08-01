/**
 * Test de arquitectura Fase 3: modos JSON no dependen del bank legacy.
 * Única excepción documentada: legacyComplete / spelling-complete.
 */
import { readFileSync, readdirSync } from 'node:fs'
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
]

const JSON_CORPUS_FILES = ['ortographyCorpus.ts', 'ortographyRegistry.ts']

const FORBIDDEN_IMPORT_RE =
  /from\s+['"]@\/spelling\/(bank|distract|generator|lemmas\.generated)['"]/
const FORBIDDEN_SYMBOL_RE = /\b(SPELL_BANK|makeDistractors)\b/

function readSrc(filePath: string): string {
  return readFileSync(filePath, 'utf8')
}

function assertNoLegacyDeps(label: string, src: string) {
  expect(FORBIDDEN_IMPORT_RE.test(src), `${label}: import legacy`).toBe(false)
  expect(FORBIDDEN_SYMBOL_RE.test(src), `${label}: símbolo legacy`).toBe(false)
  expect(src.includes('lemmas.generated'), `${label}: lemmas.generated`).toBe(false)
}

describe('arquitectura ortografía JSON', () => {
  it('adaptadores JSON no importan bank / distract / generator / lemmas.generated', () => {
    for (const name of JSON_ADAPTER_FILES) {
      assertNoLegacyDeps(name, readSrc(path.join(ADAPTERS_DIR, name)))
    }
    for (const name of JSON_CORPUS_FILES) {
      assertNoLegacyDeps(name, readSrc(path.join(FEINETAS_DIR, name)))
    }
  })

  it('legacyComplete es la única excepción documentada (frases, no bank de lemas)', () => {
    const src = readSrc(path.join(ROOT, 'src/spelling/legacyComplete.ts'))
    expect(src.includes('SPELL_COMPLETE_USES_LEGACY')).toBe(true)
    expect(src.includes('SPELL_CONTEXTS')).toBe(true)
    assertNoLegacyDeps('legacyComplete.ts', src)
  })

  it('catalog: solo spelling-complete es legacy-spell', () => {
    const spelling = listMinigames().filter((m) => m.category === 'spelling')
    const legacy = spelling.filter((m) => m.source === 'legacy')
    expect(legacy.map((m) => m.id)).toEqual(['spelling-complete'])
    expect(getMinigame('spelling-complete').mechanicId).toBe('legacy-spell')

    const jsonModes: SpellPlayMode[] = [
      'correct',
      'missing',
      'picture',
      'intruder',
      'mix',
      'review',
    ]
    for (const mode of jsonModes) {
      const g = getMinigame(`spelling-${mode}`)
      expect(g.source).toBe('pack')
      expect(g.mechanicId).toBe('ortografia-lemma-mcq')
      expect(g.packIds.length).toBe(10)
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
