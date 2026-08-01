/**
 * Mezcla total: mecánicas JSON elegibles (sin Imagen hasta image.ref reales).
 * Nunca bloquea la ronda: si una mecánica falla, prueba otra.
 */
import { buildOrtografiaCompleteQuestion } from '@/minigames/adapters/ortografiaComplete'
import { buildOrtografiaCorrectQuestion } from '@/minigames/adapters/ortografiaCorrect'
import { buildOrtografiaIntruderQuestion } from '@/minigames/adapters/ortografiaIntruder'
import { buildOrtografiaMissingQuestion } from '@/minigames/adapters/ortografiaMissing'
import { mulberry32 } from '@/minigames/adapters/ortografiaShared'
import { SPELL_ROUND_SIZE, type SpellMcqQuestion, type SpellQuestion } from '@/spelling/types'

type MixerKind = 'complete' | 'correct' | 'intruder' | 'missing'

const MIXER_WEIGHTS: MixerKind[] = [
  'complete',
  'complete',
  'correct',
  'intruder',
  'missing',
  'complete',
  'correct',
  'intruder',
]

const JSON_MIXERS: MixerKind[] = ['correct', 'intruder', 'missing', 'complete']

function tryBuild(
  kind: MixerKind,
  seed: number,
  usedRefs: Set<string>,
  usedPhraseIds: Set<string>,
): SpellMcqQuestion {
  switch (kind) {
    case 'complete':
      return buildOrtografiaCompleteQuestion(seed, usedPhraseIds, 'mix')
    case 'correct':
      return buildOrtografiaCorrectQuestion(seed, usedRefs, 'mix')
    case 'intruder':
      return buildOrtografiaIntruderQuestion(seed, usedRefs, 'mix')
    case 'missing':
      return buildOrtografiaMissingQuestion(seed, usedRefs, 'mix')
  }
}

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
    while (q == null && attempts < 16) {
      attempts += 1
      try {
        q = tryBuild(kind, qSeed + attempts, usedRefs, usedPhraseIds)
      } catch {
        kind = JSON_MIXERS[Math.floor(rand() * JSON_MIXERS.length)]!
        q = null
      }
    }
    if (!q) {
      // Último recurso estable: missing casi siempre tiene pool.
      q = buildOrtografiaMissingQuestion(qSeed + 99, usedRefs, 'mix')
    }
    out.push(q)
  }
  return out
}
