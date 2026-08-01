/**
 * Mis fallos: claves JSON (`packId:lemmaId`) vs legacy complete (`ctx:*`).
 * Pipelines separados; sin rehidratar el banco legacy de lemas.
 */
import { getLemmaByRef, parseOrtographyMissKey } from '@/feinetas/ortographyCorpus'
import { buildOrtografiaCorrectQuestion } from '@/minigames/adapters/ortografiaCorrect'
import { buildOrtografiaIntruderQuestion } from '@/minigames/adapters/ortografiaIntruder'
import { buildOrtografiaMissingQuestion } from '@/minigames/adapters/ortografiaMissing'
import { buildOrtografiaPictureQuestion } from '@/minigames/adapters/ortografiaPicture'
import { mulberry32 } from '@/minigames/adapters/ortografiaShared'
import { buildOrtografiaMixRound } from '@/minigames/adapters/ortografiaMix'
import {
  buildLegacyCompleteQuestion,
  isLegacyCompleteMissKey,
} from '@/spelling/legacyComplete'
import type { SpellMissEntry } from '@/spelling/missStore'
import { SPELL_ROUND_SIZE, type SpellMcqQuestion, type SpellQuestion } from '@/spelling/types'

const REVIEW_JSON_KINDS = ['correct', 'missing', 'picture', 'intruder'] as const

function buildJsonForEntry(
  kind: (typeof REVIEW_JSON_KINDS)[number],
  seed: number,
  usedRefs: Set<string>,
  packId: string,
  lemmaId: string,
): SpellMcqQuestion {
  const entry = getLemmaByRef(packId, lemmaId)
  if (!entry) {
    throw new Error(`[ortografia-review] Lema no encontrado: ${packId}:${lemmaId}`)
  }
  switch (kind) {
    case 'correct':
      return buildOrtografiaCorrectQuestion(seed, usedRefs, 'review', entry)
    case 'missing':
      return buildOrtografiaMissingQuestion(seed, usedRefs, 'review', entry)
    case 'picture':
      return buildOrtografiaPictureQuestion(seed, usedRefs, 'review', entry)
    case 'intruder':
      return buildOrtografiaIntruderQuestion(seed, usedRefs, 'review', entry)
  }
}

export function buildOrtografiaReviewRound(
  count = SPELL_ROUND_SIZE,
  seed = Date.now(),
  preferMisses: SpellMissEntry[] = [],
): SpellQuestion[] {
  const usedRefs = new Set<string>()
  const usedCtx = new Set<string>()
  const out: SpellQuestion[] = []

  const jsonMisses = preferMisses.filter((m) => parseOrtographyMissKey(m.key))
  const ctxMisses = preferMisses.filter((m) => isLegacyCompleteMissKey(m.key))
  // Claves huérfanas del bank antiguo (palabra suelta): se ignoran a propósito.

  const prioritized = [...jsonMisses, ...ctxMisses]

  for (let i = 0; i < count; i += 1) {
    const qSeed = seed + i * 9173
    const rand = mulberry32(qSeed)

    if (i < prioritized.length) {
      const miss = prioritized[i]!
      if (isLegacyCompleteMissKey(miss.key)) {
        out.push(
          buildLegacyCompleteQuestion(qSeed, usedCtx, 'review', [miss.key]),
        )
        continue
      }
      const parsed = parseOrtographyMissKey(miss.key)
      if (parsed && getLemmaByRef(parsed.packId, parsed.lemmaId)) {
        const kind = REVIEW_JSON_KINDS[Math.floor(rand() * REVIEW_JSON_KINDS.length)]!
        out.push(buildJsonForEntry(kind, qSeed, usedRefs, parsed.packId, parsed.lemmaId))
        continue
      }
    }

    // Relleno: mix JSON + complete (misma orquestación, sin bank)
    const fill = buildOrtografiaMixRound(1, qSeed)[0]!
    // Re-tag mode review
    out.push({ ...fill, mode: 'review' })
    if (fill.targetKey?.startsWith('ctx:')) {
      usedCtx.add(fill.targetKey.slice(4))
    } else if (fill.targetKey) {
      usedRefs.add(fill.targetKey)
    }
  }

  return out
}
