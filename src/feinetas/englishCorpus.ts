import type { EnglishLemma, EnglishLemmaPack } from '@/feinetas/englishLemmaPack'
import { listEnglishPacks } from '@/feinetas/englishRegistry'

export type EnglishCorpusEntry = {
  packId: string
  lemma: EnglishLemma
}

export type EnglishCorpus = {
  entries: EnglishCorpusEntry[]
}

let cached: EnglishCorpus | null = null

function buildCorpus(packs: EnglishLemmaPack[]): EnglishCorpus {
  const entries: EnglishCorpusEntry[] = []
  for (const pack of packs) {
    if (pack.pack.revisionStatus === 'draft') continue
    for (const lemma of pack.lemmas) {
      if (lemma.status === 'deprecated') continue
      entries.push({ packId: pack.pack.id, lemma })
    }
  }
  return { entries }
}

export function getEnglishCorpus(): EnglishCorpus {
  if (!cached) cached = buildCorpus(listEnglishPacks())
  return cached
}

export function englishMissKey(packId: string, lemmaId: string): string {
  return `${packId}:${lemmaId}`
}

export function parseEnglishMissKey(
  key: string,
): { packId: string; lemmaId: string } | null {
  const i = key.indexOf(':')
  if (i <= 0) return null
  return { packId: key.slice(0, i), lemmaId: key.slice(i + 1) }
}

export function findEnglishCorpusEntry(
  packId: string,
  lemmaId: string,
): EnglishCorpusEntry | undefined {
  return getEnglishCorpus().entries.find(
    (e) => e.packId === packId && e.lemma.id === lemmaId,
  )
}

export function listEnglishCorpusForPack(packId: string): EnglishCorpusEntry[] {
  return getEnglishCorpus().entries.filter((e) => e.packId === packId)
}
