/**
 * Contrato común de pregunta matemática (Fase 4 unificación).
 * Los generadores legacy no cambian: los adaptadores normalizan la salida.
 */

export type MathsSkillId = 'tables' | 'calc' | 'money' | 'clocks'

/** Forma de presentación (mecánica reutilizable a nivel de contrato). */
export type MathsShape =
  | 'mcq'
  | 'match'
  | 'learn'
  | 'timer'
  | 'build'
  | 'order'
  | 'compare'
  | 'truefalse'
  | 'review'

export type MathsAnswer =
  | { type: 'index'; correctIndex: number }
  | { type: 'order'; sequence: number[] }
  | { type: 'compare'; greater: 'left' | 'right' }
  | { type: 'truefalse'; isTrue: boolean }
  | { type: 'build'; targetCents: number }
  | { type: 'match'; key: string }

export type MathsQuestion = {
  questionId: string
  skillId: MathsSkillId
  modeId: string
  prompt: string
  options: string[]
  answer: MathsAnswer
  difficulty?: string
  metadata: Record<string, unknown>
}

/** Comprueba respuesta MCQ por índice (mecánica compartida). */
export function isMcqIndexCorrect(
  selectedIndex: number,
  answer: MathsAnswer,
): boolean {
  return answer.type === 'index' && selectedIndex === answer.correctIndex
}

export function assertValidMathsQuestion(q: MathsQuestion): void {
  if (!q.questionId) throw new Error('[maths] questionId vacío')
  if (!q.skillId) throw new Error('[maths] skillId vacío')
  if (!q.modeId) throw new Error('[maths] modeId vacío')
  if (typeof q.prompt !== 'string') throw new Error('[maths] prompt inválido')
  if (!Array.isArray(q.options)) throw new Error('[maths] options inválidas')
  if (!q.answer || typeof q.answer !== 'object' || !('type' in q.answer)) {
    throw new Error('[maths] answer inválido')
  }
  if (q.answer.type === 'index') {
    if (q.options.length < 2) throw new Error('[maths] MCQ sin opciones')
    if (
      q.answer.correctIndex < 0 ||
      q.answer.correctIndex >= q.options.length
    ) {
      throw new Error('[maths] correctIndex fuera de rango')
    }
  }
}
