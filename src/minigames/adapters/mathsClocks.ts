/**
 * Adaptador thin: Horas → contrato MathsQuestion.
 * No altera la lógica de `buildTrainQueue` / `buildMatchPairs`.
 */
import {
  buildMatchPairs,
  buildTrainQueue,
} from '@/clock/generator'
import type { ClockLang, ClockMatchPair, ClockMcqQuestion } from '@/clock/types'
import { clockQuestionId, stampClockQuestion } from '@/math/missIds'
import { clockKey } from '@/clock/format'
import {
  assertValidMathsQuestion,
  type MathsQuestion,
} from '@/minigames/mathsContract'

export function clockQuestionToMaths(
  q: ClockMcqQuestion,
  lang: ClockLang,
  modeId: string,
): MathsQuestion {
  const stamped = stampClockQuestion(q, lang)
  const questionId = clockQuestionId(stamped, lang)
  const out: MathsQuestion = {
    questionId,
    skillId: 'clocks',
    modeId,
    prompt: stamped.prompt ?? '¿Qué hora es?',
    options: [...stamped.options],
    answer: { type: 'index', correctIndex: stamped.correctIndex },
    metadata: {
      raw: stamped,
      lang,
      kind: stamped.kind ?? 'read',
      time: stamped.time,
    },
  }
  assertValidMathsQuestion(out)
  return out
}

export function clockMatchPairToMaths(
  pair: ClockMatchPair,
  lang: ClockLang,
): MathsQuestion {
  const key = clockKey(pair.time)
  const out: MathsQuestion = {
    questionId: `clock:match:${lang}:${key}`,
    skillId: 'clocks',
    modeId: 'match',
    prompt: pair.label,
    options: [],
    answer: { type: 'match', key },
    metadata: { raw: pair, lang, time: pair.time, label: pair.label },
  }
  assertValidMathsQuestion(out)
  return out
}

export function buildClocksTrainMathsRound(
  lang: ClockLang,
  count: number,
  seed: number,
): MathsQuestion[] {
  return buildTrainQueue(lang, count, seed).map((q) =>
    clockQuestionToMaths(q, lang, 'train'),
  )
}

export function buildClocksMatchMathsRound(
  lang: ClockLang,
  count: number,
  seed: number,
): MathsQuestion[] {
  return buildMatchPairs(lang, count, seed).map((p) =>
    clockMatchPairToMaths(p, lang),
  )
}
