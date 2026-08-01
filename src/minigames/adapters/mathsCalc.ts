/**
 * Adaptador thin: Cálculo → contrato MathsQuestion.
 * No altera la lógica de `buildCalcQueue`.
 */
import { buildCalcQueue } from '@/calc/generator'
import type { CalcPlayMode, CalcQuestion } from '@/calc/types'
import { calcQuestionId, stampCalcQuestion } from '@/math/missIds'
import {
  assertValidMathsQuestion,
  type MathsQuestion,
} from '@/minigames/mathsContract'

export function calcQuestionToMaths(q: CalcQuestion): MathsQuestion {
  const stamped = stampCalcQuestion(q)
  const questionId = calcQuestionId(stamped)
  const modeId = stamped.mode
  const base = {
    questionId,
    skillId: 'calc' as const,
    modeId,
    difficulty: stamped.difficulty,
    metadata: { raw: stamped, kind: stamped.kind },
  }

  switch (stamped.kind) {
    case 'mcq': {
      const out: MathsQuestion = {
        ...base,
        prompt: stamped.expression
          ? `${stamped.prompt}\n${stamped.expression}`
          : stamped.prompt,
        options: [...stamped.options],
        answer: { type: 'index', correctIndex: stamped.correctIndex },
      }
      assertValidMathsQuestion(out)
      return out
    }
    case 'order': {
      const out: MathsQuestion = {
        ...base,
        prompt: stamped.prompt,
        options: stamped.items.map(String),
        answer: { type: 'order', sequence: [...stamped.answer] },
      }
      assertValidMathsQuestion(out)
      return out
    }
    case 'truefalse': {
      const out: MathsQuestion = {
        ...base,
        prompt: stamped.prompt,
        options: ['Verdadero', 'Falso'],
        answer: { type: 'truefalse', isTrue: stamped.isTrue },
        metadata: { ...base.metadata, expression: stamped.expression },
      }
      assertValidMathsQuestion(out)
      return out
    }
    case 'compare': {
      const out: MathsQuestion = {
        ...base,
        prompt: stamped.prompt,
        options: [String(stamped.left), String(stamped.right)],
        answer: { type: 'compare', greater: stamped.greater },
        metadata: {
          ...base.metadata,
          left: stamped.left,
          right: stamped.right,
        },
      }
      assertValidMathsQuestion(out)
      return out
    }
  }
}

export function buildCalcMathsRound(
  mode: CalcPlayMode,
  count: number,
  seed: number,
): MathsQuestion[] {
  return buildCalcQueue(mode, count, seed).map(calcQuestionToMaths)
}
