import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import packJson from '@feinetas/palabras/relaciones-semanticas.json'
import {
  WORDS_SEMANTIC_RELATION_SCHEMA_VERSION,
  assertValidWordsSemanticRelationPack,
  undirectedRelationKey,
  validateWordsSemanticRelationPack,
  type WordsSemanticRelationPack,
} from '@/feinetas/wordsSemanticRelationPack'

const EXPECTED_SYN_IDS = [
  'rel-contento-alegre',
  'rel-grande-enorme',
  'rel-lugar-sitio',
  'rel-alzar-levantar',
  'rel-sanar-curar',
  'rel-aroma-perfume',
  'rel-bonito-hermoso',
  'rel-abecedario-alfabeto',
  'rel-complicada-dificil',
  'rel-vencer-triunfar',
  'rel-veloz-rapido',
  'rel-disgustado-enfadado',
] as const

const EXPECTED_ANT_IDS = [
  'rel-grande-pequeno',
  'rel-alto-bajo',
  'rel-veloz-lento',
  'rel-dificil-facil',
  'rel-disfrutar-sufrir',
  'rel-vencer-perder',
  'rel-tacano-generoso',
  'rel-apagar-encender',
  'rel-ocupado-libre',
  'rel-claro-oscuro',
  'rel-ruidoso-silencioso',
  'rel-alegre-triste',
  'rel-montar-desmontar',
  'rel-bonito-feo',
] as const

describe('feinetas / palabras / relaciones-semanticas', () => {
  it('pasa validación schemaVersion 1', () => {
    const issues = validateWordsSemanticRelationPack(packJson)
    expect(issues).toEqual([])
    assertValidWordsSemanticRelationPack(packJson)
    expect(packJson.schemaVersion).toBe(WORDS_SEMANTIC_RELATION_SCHEMA_VERSION)
  })

  it('metadatos congelados y packKind correcto', () => {
    const pack = packJson as WordsSemanticRelationPack
    expect(pack.pack.id).toBe('palabras-relaciones-semanticas')
    expect(pack.pack.ownerBank).toBe('BANCO_RELACIONES_SEMANTICAS.md')
    expect(pack.pack.packKind).toBe('semantic-relation')
    expect(pack.pack.revisionStatus).toBe('frozen')
    expect(pack.pack.level).toBe('3-primaria')
    expect(pack.pack.locale).toBe('es-ES')
    expect(pack.pack.contentVersion).toBeGreaterThanOrEqual(2)
  })

  it('conserva el núcleo y amplía sinónimos/antónimos desde fichas', () => {
    const pack = packJson as WordsSemanticRelationPack
    const syn = pack.items.filter((i) => i.relation === 'synonym')
    const ant = pack.items.filter((i) => i.relation === 'antonym')
    expect(syn.length).toBeGreaterThanOrEqual(12)
    expect(ant.length).toBeGreaterThanOrEqual(14)
    expect(pack.items.length).toBeGreaterThanOrEqual(26)
    for (const id of EXPECTED_SYN_IDS) {
      expect(syn.map((i) => i.id)).toContain(id)
    }
    for (const id of EXPECTED_ANT_IDS) {
      expect(ant.map((i) => i.id)).toContain(id)
    }
  })

  it('ids únicos', () => {
    const pack = packJson as WordsSemanticRelationPack
    const ids = pack.items.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('relaciones dirigidas únicas y sin pares espejo', () => {
    const pack = packJson as WordsSemanticRelationPack
    const directed = new Set<string>()
    const undirected = new Set<string>()
    for (const item of pack.items) {
      const dir = `${item.relation}|${item.anchor}|${item.target}`
      expect(directed.has(dir)).toBe(false)
      directed.add(dir)
      const und = undirectedRelationKey(item.relation, item.anchor, item.target)
      expect(undirected.has(und)).toBe(false)
      undirected.add(und)
    }
  })

  it('difficulty 1–4 y distractores editoriales (≥2, sin anchor/target)', () => {
    const pack = packJson as WordsSemanticRelationPack
    for (const item of pack.items) {
      expect(item.difficulty).toBeGreaterThanOrEqual(1)
      expect(item.difficulty).toBeLessThanOrEqual(4)
      expect(item.distractors.length).toBeGreaterThanOrEqual(2)
      const norm = (s: string) => s.toLocaleLowerCase('es')
      for (const d of item.distractors) {
        expect(d.trim().length).toBeGreaterThan(0)
        expect(norm(d)).not.toBe(norm(item.anchor))
        expect(norm(d)).not.toBe(norm(item.target))
      }
    }
  })

  it('no hay marcas de pendiente en JSON ni en el MD congelado', () => {
    const pack = packJson as WordsSemanticRelationPack
    const blob = JSON.stringify(pack).toLocaleLowerCase('es')
    expect(blob).not.toContain('revisión aparte')
    expect(blob).not.toContain('revision aparte')

    const mdPath = path.resolve(
      process.cwd(),
      'feinetas/editorial/BANCO_RELACIONES_SEMANTICAS.md',
    )
    const md = readFileSync(mdPath, 'utf8').toLocaleLowerCase('es')
    expect(md).not.toContain('revisión aparte')
    expect(md).toContain('congelado')
    expect(md).toContain('aprobado')
  })

  it('no está registrado en el catálogo de minijuegos (aún no conectado)', async () => {
    const { MINIGAME_CATALOG } = await import('@/minigames/catalog')
    const connected = MINIGAME_CATALOG.some(
      (g) =>
        g.packIds?.includes('palabras-relaciones-semanticas') ||
        g.id.includes('sinonimos') ||
        g.id.includes('antonimos'),
    )
    expect(connected).toBe(false)
  })
})
