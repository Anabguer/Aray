import {
  ENGLISH_PLAYABLE_MODES,
  ENGLISH_ROUND_SIZE,
  type EnglishMcqQuestion,
  type EnglishPlayMode,
} from '@/english/types'
import { canBuildEnglishIntruder } from '@/minigames/adapters/englishIntruder'
import { buildEnglishIntruderQuestion } from '@/minigames/adapters/englishIntruder'
import { buildEnglishMeaningQuestion } from '@/minigames/adapters/englishMeaning'
import { buildEnglishMissingQuestion } from '@/minigames/adapters/englishMissing'
import { buildEnglishTranslateQuestion } from '@/minigames/adapters/englishTranslate'
import { mulberry32 } from '@/minigames/adapters/englishShared'

function buildOne(
  packId: string,
  sub: Exclude<EnglishPlayMode, 'mix' | 'review' | 'match'>,
  seed: number,
  used: Set<string>,
): EnglishMcqQuestion {
  switch (sub) {
    case 'meaning':
      return buildEnglishMeaningQuestion(packId, seed, used, 'mix')
    case 'translate':
      return buildEnglishTranslateQuestion(packId, seed, used, 'mix')
    case 'intruder':
      return buildEnglishIntruderQuestion(packId, seed, used, 'mix')
    case 'missing':
      return buildEnglishMissingQuestion(packId, seed, used, 'mix')
    default:
      throw new Error(`[ingles-mix] Modo desconocido: ${sub}`)
  }
}

function normalizePackIds(packIdOrIds: string | readonly string[]): string[] {
  const ids = typeof packIdOrIds === 'string' ? [packIdOrIds] : [...packIdOrIds]
  if (ids.length === 0) {
    throw new Error('[ingles-mix] hace falta al menos un pack')
  }
  return ids
}

/** Una ronda mezclada: modos + packs (uno o varios de la estación). */
export function buildEnglishMixRound(
  packIdOrIds: string | readonly string[],
  count = ENGLISH_ROUND_SIZE,
  seed = Date.now(),
): EnglishMcqQuestion[] {
  const packs = normalizePackIds(packIdOrIds)
  const random = mulberry32(seed)
  const used = new Set<string>()
  const out: EnglishMcqQuestion[] = []

  for (let i = 0; i < count; i += 1) {
    let built: EnglishMcqQuestion | null = null
    for (let attempt = 0; attempt < 24 && !built; attempt += 1) {
      const pack = packs[Math.floor(random() * packs.length)]!
      const sub =
        ENGLISH_PLAYABLE_MODES[
          Math.floor(random() * ENGLISH_PLAYABLE_MODES.length)
        ]!
      if (sub === 'intruder' && !canBuildEnglishIntruder(pack)) continue
      try {
        built = buildOne(pack, sub, seed + i * 5107 + attempt * 97, used)
      } catch {
        built = null
      }
    }
    if (!built) {
      // Último recurso: meaning del primer pack
      built = buildOne(packs[0]!, 'meaning', seed + i * 5107 + 999, used)
    }
    out.push(built)
  }
  return out
}
