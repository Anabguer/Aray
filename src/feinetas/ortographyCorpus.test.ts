import { describe, expect, it } from 'vitest'
import {
  getLemmaByRef,
  getOrtographyCorpus,
  ortographyMissKey,
  parseOrtographyMissKey,
} from '@/feinetas/ortographyCorpus'
import { listOrtographyPacks, ORTOGRAPHY_PACK_IDS } from '@/feinetas/ortographyRegistry'

describe('ortographyRegistry', () => {
  it('carga exactamente los 10 packs canónicos', () => {
    const packs = listOrtographyPacks()
    expect(packs).toHaveLength(10)
    expect(packs.map((p) => p.pack.id).sort()).toEqual([...ORTOGRAPHY_PACK_IDS].sort())
  })

  it('todos los packs están approved o frozen', () => {
    for (const p of listOrtographyPacks()) {
      expect(['approved', 'frozen']).toContain(p.pack.revisionStatus)
    }
  })
})

describe('ortographyCorpus', () => {
  it('une ~216 lemas activos sin refs duplicadas', () => {
    const corpus = getOrtographyCorpus()
    expect(corpus.packs).toHaveLength(10)
    expect(corpus.entries.length).toBeGreaterThanOrEqual(210)
    expect(corpus.entries.length).toBeLessThanOrEqual(220)
    expect(corpus.byRef.size).toBe(corpus.entries.length)
  })

  it('resuelve por packId:lemmaId', () => {
    const entry = getLemmaByRef('ortografia-rr', 'rr-perro')
    expect(entry?.lemma.lemma).toBe('perro')
    expect(ortographyMissKey('ortografia-rr', 'rr-perro')).toBe('ortografia-rr:rr-perro')
  })

  it('parseOrtographyMissKey ignora ctx: y acepta packs', () => {
    expect(parseOrtographyMissKey('ctx:hay-1')).toBeNull()
    expect(parseOrtographyMissKey('perro')).toBeNull()
    expect(parseOrtographyMissKey('ortografia-rr:rr-perro')).toEqual({
      packId: 'ortografia-rr',
      lemmaId: 'rr-perro',
    })
  })
})
