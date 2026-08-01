/**
 * Corpus unificado de lemas ortográficos (unión de packs aprobados).
 * Fuente única para modos JSON de Ortografía. No usa el banco legacy.
 */
import type { OrtographyLemma, OrtographyLemmaPack } from '@/feinetas/ortographyLemmaPack'
import { listOrtographyPacks, ORTOGRAPHY_PACK_IDS } from '@/feinetas/ortographyRegistry'

export type OrtographyCorpusEntry = {
  packId: string
  lemma: OrtographyLemma
  pack: OrtographyLemmaPack
}

export type OrtographyCorpus = {
  packs: OrtographyLemmaPack[]
  entries: OrtographyCorpusEntry[]
  /** Clave: `${packId}:${lemmaId}` */
  byRef: Map<string, OrtographyCorpusEntry>
  /** Lemas con image.recommended === true */
  pictureEntries: OrtographyCorpusEntry[]
}

export function ortographyMissKey(packId: string, lemmaId: string): string {
  return `${packId}:${lemmaId}`
}

export function parseOrtographyMissKey(
  key: string,
): { packId: string; lemmaId: string } | null {
  if (key.startsWith('ctx:')) return null
  const idx = key.indexOf(':')
  if (idx <= 0) return null
  const packId = key.slice(0, idx)
  const lemmaId = key.slice(idx + 1)
  if (!packId.startsWith('ortografia-') || !lemmaId) return null
  return { packId, lemmaId }
}

function isActiveLemma(lemma: OrtographyLemma): boolean {
  return lemma.status !== 'deprecated'
}

function buildCorpus(): OrtographyCorpus {
  const packs = listOrtographyPacks().filter((p) => {
    const st = p.pack.revisionStatus
    return st === 'approved' || st === 'frozen'
  })

  const entries: OrtographyCorpusEntry[] = []
  const byRef = new Map<string, OrtographyCorpusEntry>()
  const lemmaOwner = new Map<string, string>()

  for (const pack of packs) {
    for (const lemma of pack.lemmas) {
      if (!isActiveLemma(lemma)) continue
      const ref = ortographyMissKey(pack.pack.id, lemma.id)
      const entry: OrtographyCorpusEntry = { packId: pack.pack.id, lemma, pack }
      if (byRef.has(ref)) {
        throw new Error(`[ortografia-corpus] Ref duplicada: ${ref}`)
      }
      const lemmaKey = lemma.lemma.toLocaleLowerCase('es')
      const prevOwner = lemmaOwner.get(lemmaKey)
      if (prevOwner && prevOwner !== pack.pack.id) {
        throw new Error(
          `[ortografia-corpus] Lema «${lemma.lemma}» en ${prevOwner} y ${pack.pack.id}`,
        )
      }
      lemmaOwner.set(lemmaKey, pack.pack.id)
      byRef.set(ref, entry)
      entries.push(entry)
    }
  }

  return {
    packs,
    entries,
    byRef,
    pictureEntries: entries.filter((e) => e.lemma.image.recommended),
  }
}

let cached: OrtographyCorpus | null = null

export function getOrtographyCorpus(): OrtographyCorpus {
  if (!cached) cached = buildCorpus()
  return cached
}

export function getLemmaByRef(packId: string, lemmaId: string): OrtographyCorpusEntry | undefined {
  return getOrtographyCorpus().byRef.get(ortographyMissKey(packId, lemmaId))
}

export function listOrtographyPackIds(): readonly string[] {
  return ORTOGRAPHY_PACK_IDS
}
