/**
 * Mis fallos: claves JSON de lemas (`packId:lemmaId`) y de frases
 * (`ortografia-frases-completar:frase-*`). Sin banco legacy.
 * Reconstrucción con mecánicas monorregla (sin fillers / sin Imagen).
 */
import { getLemmaByRef, parseOrtographyMissKey } from '@/feinetas/ortographyCorpus'
import {
  buildOrtografiaCompleteQuestion,
  isOrtographyPhraseMissKey,
} from '@/minigames/adapters/ortografiaComplete'
import { buildOrtografiaCorrectQuestion } from '@/minigames/adapters/ortografiaCorrect'
import { buildOrtografiaIntruderQuestion } from '@/minigames/adapters/ortografiaIntruder'
import { buildOrtografiaMissingQuestion } from '@/minigames/adapters/ortografiaMissing'
import { mulberry32 } from '@/minigames/adapters/ortografiaShared'
import {
  canBuildBareCorrectQuestion,
  canBuildIntruderQuestion,
  canBuildMissingQuestion,
} from '@/minigames/adapters/ortografiaShared'
import { buildOrtografiaMixRound } from '@/minigames/adapters/ortografiaMix'
import type { SpellMissEntry } from '@/spelling/missStore'
import { SPELL_ROUND_SIZE, type SpellMcqQuestion, type SpellQuestion } from '@/spelling/types'

const REVIEW_JSON_KINDS = ['correct', 'missing', 'intruder'] as const

/**
 * Si Intrusa o Forma correcta no pueden construirse → Letra de la regla.
 * Si Missing tampoco → Correct → Intrusa (último recurso del mismo lema).
 */
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

  const tryMissing = () => {
    if (!canBuildMissingQuestion(entry)) {
      throw new Error(`[ortografia-review] Sin missing para ${packId}:${lemmaId}`)
    }
    return buildOrtografiaMissingQuestion(seed, usedRefs, 'review', entry)
  }

  switch (kind) {
    case 'correct':
      if (!canBuildBareCorrectQuestion(entry)) return tryMissing()
      return buildOrtografiaCorrectQuestion(seed, usedRefs, 'review', entry)
    case 'intruder':
      if (!canBuildIntruderQuestion(entry)) return tryMissing()
      return buildOrtografiaIntruderQuestion(seed, usedRefs, 'review', entry)
    case 'missing':
      if (canBuildMissingQuestion(entry)) {
        return buildOrtografiaMissingQuestion(seed, usedRefs, 'review', entry)
      }
      if (canBuildBareCorrectQuestion(entry)) {
        return buildOrtografiaCorrectQuestion(seed, usedRefs, 'review', entry)
      }
      if (canBuildIntruderQuestion(entry)) {
        return buildOrtografiaIntruderQuestion(seed, usedRefs, 'review', entry)
      }
      throw new Error(`[ortografia-review] Sin mecánica válida para ${packId}:${lemmaId}`)
  }
}

export function buildOrtografiaReviewRound(
  count = SPELL_ROUND_SIZE,
  seed = Date.now(),
  preferMisses: SpellMissEntry[] = [],
): SpellQuestion[] {
  const usedRefs = new Set<string>()
  const usedPhraseIds = new Set<string>()
  const out: SpellQuestion[] = []

  const jsonMisses = preferMisses.filter((m) => parseOrtographyMissKey(m.key))
  const phraseMisses = preferMisses.filter((m) => isOrtographyPhraseMissKey(m.key))

  const prioritized = [...jsonMisses, ...phraseMisses]

  for (let i = 0; i < count; i += 1) {
    const qSeed = seed + i * 9173
    const rand = mulberry32(qSeed)

    if (i < prioritized.length) {
      const miss = prioritized[i]!
      if (isOrtographyPhraseMissKey(miss.key)) {
        out.push(
          buildOrtografiaCompleteQuestion(qSeed, usedPhraseIds, 'review', [miss.key]),
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

    const fill = buildOrtografiaMixRound(1, qSeed)[0]!
    out.push({ ...fill, mode: 'review' })
    if (fill.targetKey && isOrtographyPhraseMissKey(fill.targetKey)) {
      usedPhraseIds.add(fill.targetKey.split(':').slice(1).join(':'))
    } else if (fill.targetKey) {
      usedRefs.add(fill.targetKey)
    }
  }

  return out
}
