import {
  ENGLISH_PLAYABLE_MODES,
  ENGLISH_ROUND_SIZE,
  type EnglishMcqQuestion,
  type EnglishPlayMode,
} from '@/english/types'
import { buildEnglishIntruderQuestion } from '@/minigames/adapters/englishIntruder'
import { buildEnglishMeaningQuestion } from '@/minigames/adapters/englishMeaning'
import { buildEnglishMissingQuestion } from '@/minigames/adapters/englishMissing'
import { buildEnglishTranslateQuestion } from '@/minigames/adapters/englishTranslate'
import { mulberry32 } from '@/minigames/adapters/englishShared'

function buildOne(
  packId: string,
  sub: Exclude<EnglishPlayMode, 'mix' | 'review'>,
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

export function buildEnglishMixRound(
  packId: string,
  count = ENGLISH_ROUND_SIZE,
  seed = Date.now(),
): EnglishMcqQuestion[] {
  const random = mulberry32(seed)
  const used = new Set<string>()
  const out: EnglishMcqQuestion[] = []
  for (let i = 0; i < count; i += 1) {
    const sub =
      ENGLISH_PLAYABLE_MODES[
        Math.floor(random() * ENGLISH_PLAYABLE_MODES.length)
      ]!
    out.push(buildOne(packId, sub, seed + i * 5107, used))
  }
  return out
}
