/**
 * Mezcla total: mecánicas JSON de lemas + Completa la frase (pack frases).
 * Sin banco legacy de lemas ni frases TS.
 */
import { buildOrtografiaCompleteQuestion } from '@/minigames/adapters/ortografiaComplete'
import { buildOrtografiaCorrectQuestion } from '@/minigames/adapters/ortografiaCorrect'
import { buildOrtografiaIntruderQuestion } from '@/minigames/adapters/ortografiaIntruder'
import { buildOrtografiaMissingQuestion } from '@/minigames/adapters/ortografiaMissing'
import { buildOrtografiaPictureQuestion } from '@/minigames/adapters/ortografiaPicture'
import { mulberry32 } from '@/minigames/adapters/ortografiaShared'
import { SPELL_ROUND_SIZE, type SpellMcqQuestion, type SpellQuestion } from '@/spelling/types'

type MixerKind = 'complete' | 'correct' | 'intruder' | 'missing' | 'picture'

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

const JSON_MIXERS: MixerKind[] = ['correct', 'intruder', 'missing', 'picture', 'complete']

export function buildOrtografiaMixRound(
  count = SPELL_ROUND_SIZE,
  seed = Date.now(),
): SpellQuestion[] {
  const usedRefs = new Set<string>()
  const usedPhraseIds = new Set<string>()
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
        switch (kind) {
          case 'complete':
            q = buildOrtografiaCompleteQuestion(qSeed + attempts, usedPhraseIds, 'mix')
            break
          case 'correct':
            q = buildOrtografiaCorrectQuestion(qSeed + attempts, usedRefs, 'mix')
            break
          case 'intruder':
            q = buildOrtografiaIntruderQuestion(qSeed + attempts, usedRefs, 'mix')
            break
          case 'missing':
            q = buildOrtografiaMissingQuestion(qSeed + attempts, usedRefs, 'mix')
            break
          case 'picture':
            q = buildOrtografiaPictureQuestion(qSeed + attempts, usedRefs, 'mix')
            break
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
