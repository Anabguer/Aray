/**
 * Adaptador thin: Tablas → contrato MathsQuestion.
 * No altera la lógica de `buildTrainQueue` / `buildMatchPairs`.
 */
import { buildMatchPairs } from '@/math/match'
import { mulberry32 } from '@/math/rng'
import { buildTrainQueue } from '@/math/selector'
import { factKeyOf } from '@/math/tables'
import type { ProgressState, QuestionCard } from '@/math/types'
import {
  assertValidMathsQuestion,
  type MathsQuestion,
} from '@/minigames/mathsContract'

export function tablesCardToMaths(
  card: QuestionCard,
  modeId: string,
): MathsQuestion {
  const key = factKeyOf(card.fact)
  const correctIndex = card.options.indexOf(card.fact.product)
  const out: MathsQuestion = {
    questionId: `tables:fact:${key}:${card.fact.a}x${card.fact.b}`,
    skillId: 'tables',
    modeId,
    prompt: `${card.fact.a} × ${card.fact.b}`,
    options: card.options.map(String),
    answer: { type: 'index', correctIndex },
    metadata: {
      raw: card,
      fact: card.fact,
      factKey: key,
    },
  }
  assertValidMathsQuestion(out)
  return out
}

export function buildTablesTrainMathsRound(
  tables: number[],
  progress: ProgressState,
  count: number,
  seed: number,
  modeId: string = 'train',
): MathsQuestion[] {
  const random = mulberry32(seed)
  return buildTrainQueue(tables, progress, count, random).map((c) =>
    tablesCardToMaths(c, modeId),
  )
}

export function buildTablesMatchMathsRound(table: number): MathsQuestion[] {
  return buildMatchPairs(table).map((p) => {
    const key = factKeyOf(p.fact)
    const out: MathsQuestion = {
      questionId: `tables:match:${key}`,
      skillId: 'tables',
      modeId: 'match',
      prompt: p.label,
      options: [],
      answer: { type: 'match', key },
      metadata: { raw: p, fact: p.fact, product: p.product },
    }
    assertValidMathsQuestion(out)
    return out
  })
}
