/**
 * Adaptador thin: Dinero → contrato MathsQuestion.
 * No altera la lógica de `buildMoneyRound`.
 */
import { buildMoneyRound } from '@/money/generator'
import type { MoneyPlayMode, MoneyQuestion } from '@/money/types'
import { moneyQuestionId } from '@/math/missIds'
import {
  assertValidMathsQuestion,
  type MathsQuestion,
} from '@/minigames/mathsContract'

export function moneyQuestionToMaths(q: MoneyQuestion): MathsQuestion {
  const questionId = moneyQuestionId(q)
  if (q.kind === 'build') {
    const out: MathsQuestion = {
      questionId,
      skillId: 'money',
      modeId: q.mode,
      prompt: q.prompt,
      options: [],
      answer: { type: 'build', targetCents: q.targetCents },
      metadata: { raw: q, kind: 'build', coins: q.coins },
    }
    assertValidMathsQuestion(out)
    return out
  }
  const out: MathsQuestion = {
    questionId,
    skillId: 'money',
    modeId: q.mode,
    prompt: q.detail ? `${q.prompt}\n${q.detail}` : q.prompt,
    options: [...q.options],
    answer: { type: 'index', correctIndex: q.correctIndex },
    metadata: { raw: q, kind: 'mcq' },
  }
  assertValidMathsQuestion(out)
  return out
}

export function buildMoneyMathsRound(
  mode: MoneyPlayMode,
  count: number,
  seed: number,
): MathsQuestion[] {
  return buildMoneyRound(mode, count, seed).map(moneyQuestionToMaths)
}
