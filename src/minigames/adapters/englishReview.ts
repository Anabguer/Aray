import {
  findEnglishCorpusEntry,
  parseEnglishMissKey,
} from '@/feinetas/englishCorpus'
import type { EnglishMissEntry } from '@/english/missStore'
import {
  ENGLISH_ROUND_SIZE,
  type EnglishMcqQuestion,
} from '@/english/types'
import { buildEnglishIntruderQuestion } from '@/minigames/adapters/englishIntruder'
import { buildEnglishMeaningQuestion } from '@/minigames/adapters/englishMeaning'
import { buildEnglishMissingQuestion } from '@/minigames/adapters/englishMissing'
import { buildEnglishTranslateQuestion } from '@/minigames/adapters/englishTranslate'
import { buildEnglishMixRound } from '@/minigames/adapters/englishMix'

function rebuildFromMiss(
  packId: string,
  miss: EnglishMissEntry,
  seed: number,
  used: Set<string>,
): EnglishMcqQuestion | null {
  const parsed = parseEnglishMissKey(miss.key)
  if (!parsed || parsed.packId !== packId) return null
  const entry = findEnglishCorpusEntry(parsed.packId, parsed.lemmaId)
  if (!entry) return null
  switch (miss.mode) {
    case 'meaning':
      return buildEnglishMeaningQuestion(
        packId,
        seed,
        used,
        'review',
        entry,
      )
    case 'translate':
      return buildEnglishTranslateQuestion(
        packId,
        seed,
        used,
        'review',
        entry,
      )
    case 'missing':
      return buildEnglishMissingQuestion(
        packId,
        seed,
        used,
        'review',
        entry,
      )
    case 'intruder':
      // Intrusa no ancla un lema concreto como “correcta” de la misma forma;
      // regeneramos intrusa del pack (prioriza variedad de fallos).
      return buildEnglishIntruderQuestion(packId, seed, used, 'review')
    default:
      return null
  }
}

export function buildEnglishReviewRound(
  packId: string,
  count = ENGLISH_ROUND_SIZE,
  seed = Date.now(),
  preferMisses: EnglishMissEntry[] = [],
): EnglishMcqQuestion[] {
  const used = new Set<string>()
  const out: EnglishMcqQuestion[] = []
  const packMisses = preferMisses.filter((m) =>
    m.key.startsWith(`${packId}:`),
  )
  for (let i = 0; i < packMisses.length && out.length < count; i += 1) {
    const q = rebuildFromMiss(
      packId,
      packMisses[i]!,
      seed + i * 4337,
      used,
    )
    if (q) out.push(q)
  }
  if (out.length < count) {
    const filler = buildEnglishMixRound(
      packId,
      count - out.length,
      seed + 99991,
    )
    out.push(...filler)
  }
  return out.slice(0, count)
}
