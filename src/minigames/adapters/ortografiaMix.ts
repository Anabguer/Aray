/**
 * Mezcla total: mecánicas JSON + complete legacy explícito.
 * Sin fallback silencioso hacia el banco legacy de lemas.
 */
import { buildOrtografiaCorrectQuestion } from '@/minigames/adapters/ortografiaCorrect'
import { buildOrtografiaIntruderQuestion } from '@/minigames/adapters/ortografiaIntruder'
import { buildOrtografiaMissingQuestion } from '@/minigames/adapters/ortografiaMissing'
import { buildOrtografiaPictureQuestion } from '@/minigames/adapters/ortografiaPicture'
import { mulberry32 } from '@/minigames/adapters/ortografiaShared'
import { buildLegacyCompleteQuestion } from '@/spelling/legacyComplete'
import { SPELL_ROUND_SIZE, type SpellMcqQuestion, type SpellQuestion } from '@/spelling/types'

type MixerKind = 'complete' | 'correct' | 'intruder' | 'missing' | 'picture'

/** Misma distribución que MIXERS legacy (complete×3, correct×2, …). */
const MIXER_WEIGHTS: MixerKind[] = [
  'complete',
  'complete',
  'correct',
  'intruder',
  'missing',
  'picture',
  'complete',
  'correct',
]

const JSON_MIXERS: MixerKind[] = ['correct', 'intruder', 'missing', 'picture']

function buildJsonMixer(
  kind: MixerKind,
  seed: number,
  usedRefs: Set<string>,
  usedCtx: Set<string>,
): SpellMcqQuestion {
  switch (kind) {
    case 'correct':
      return buildOrtografiaCorrectQuestion(seed, usedRefs, 'mix')
    case 'intruder':
      return buildOrtografiaIntruderQuestion(seed, usedRefs, 'mix')
    case 'missing':
      return buildOrtografiaMissingQuestion(seed, usedRefs, 'mix')
    case 'picture':
      return buildOrtografiaPictureQuestion(seed, usedRefs, 'mix')
    case 'complete':
      return buildLegacyCompleteQuestion(seed, usedCtx, 'mix')
  }
}

export function buildOrtografiaMixRound(
  count = SPELL_ROUND_SIZE,
  seed = Date.now(),
): SpellQuestion[] {
  const usedRefs = new Set<string>()
  const usedCtx = new Set<string>()
  const out: SpellQuestion[] = []

  for (let i = 0; i < count; i += 1) {
    const qSeed = seed + i * 9173
    const rand = mulberry32(qSeed)
    let kind = MIXER_WEIGHTS[Math.floor(rand() * MIXER_WEIGHTS.length)]!
    let q: SpellMcqQuestion | null = null
    let attempts = 0
    while (q == null && attempts < 12) {
      attempts += 1
      try {
        if (kind === 'complete') {
          q = buildLegacyCompleteQuestion(qSeed + attempts, usedCtx, 'mix')
        } else {
          q = buildJsonMixer(kind, qSeed + attempts, usedRefs, usedCtx)
        }
      } catch {
        kind = JSON_MIXERS[Math.floor(rand() * JSON_MIXERS.length)]!
        q = null
      }
    }
    if (!q) {
      q = buildOrtografiaCorrectQuestion(qSeed, usedRefs, 'mix')
    }
    out.push(q)
  }
  return out
}
