/**
 * Identidades estables y payloads de reconstrucción para Mis fallos
 * (Cálculo, Dinero, Horas). No aplica a Tablas.
 */
import type { CalcDifficulty, CalcPlayMode, CalcQuestion } from '@/calc/types'
import type { ClockLang, ClockMcqQuestion } from '@/clock/types'
import type { MoneyPlayMode, MoneyQuestion } from '@/money/types'

export type MathsMissSkillId = 'calc' | 'money' | 'clocks'

export type CalcMissPayload = {
  skillId: 'calc'
  modeId: CalcPlayMode
  difficulty: CalcDifficulty
  question: CalcQuestion
}

export type MoneyMissPayload = {
  skillId: 'money'
  modeId: MoneyPlayMode
  question: MoneyQuestion
}

export type ClockMissPayload = {
  skillId: 'clocks'
  modeId: 'train' | 'convert24' | 'read'
  lang: ClockLang
  question: ClockMcqQuestion
}

export type MathsMissPayload = CalcMissPayload | MoneyMissPayload | ClockMissPayload

function compact(s: string): string {
  return s.replace(/\s+/g, '').replace(/−/g, '-').replace(/×/g, 'x')
}

function clockStyle(lang: ClockLang, minute: number): 'natural' | 'digital' {
  if (lang === 'ca' && minute % 5 !== 0) return 'digital'
  return 'natural'
}

export function calcQuestionId(q: CalcQuestion): string {
  if (q.questionId) return q.questionId
  switch (q.kind) {
    case 'mcq': {
      const expr = compact(q.expression ?? q.prompt)
      const kindHint = q.id.split('-')[0] ?? q.mode
      return `calc:${kindHint}:${expr}`
    }
    case 'compare':
      return `calc:compare:${q.left}:${q.right}`
    case 'order':
      return `calc:order:${q.items.join('|')}`
    case 'truefalse':
      return `calc:truefalse:${compact(q.expression)}:${q.isTrue ? 1 : 0}`
  }
}

export function moneyQuestionId(q: MoneyQuestion): string {
  if (q.questionId) return q.questionId
  if (q.kind === 'build') return `money:build:${q.targetCents}`
  return `money:${q.mode}:${compact(q.detail ?? q.prompt)}:${q.correctIndex}`
}

export function clockQuestionId(q: ClockMcqQuestion, lang: ClockLang): string {
  if (q.questionId && q.kind !== 'convert24') return q.questionId
  if (q.kind === 'convert24') {
    // Independiente del idioma de sesión (opciones digitales 24 h).
    if (q.questionId?.startsWith('clock:c24:')) return q.questionId
    const hh = String(q.time.hour).padStart(2, '0')
    const mm = String(q.time.minute).padStart(2, '0')
    return `clock:c24:${hh}:${mm}`
  }
  const style = clockStyle(lang, q.time.minute)
  const hh = String(q.time.hour).padStart(2, '0')
  const mm = String(q.time.minute).padStart(2, '0')
  return `clock:${lang}:${hh}:${mm}:${style}`
}

export function stampCalcQuestion(q: CalcQuestion): CalcQuestion {
  const { questionId: _drop, ...rest } = q
  const questionId = calcQuestionId(rest as CalcQuestion)
  return { ...q, questionId }
}

export function stampClockQuestion(
  q: ClockMcqQuestion,
  lang: ClockLang,
): ClockMcqQuestion {
  const base = { ...q, questionId: undefined }
  const questionId = clockQuestionId(base, lang)
  return { ...q, questionId }
}

export function buildCalcMissPayload(q: CalcQuestion): CalcMissPayload {
  const stamped = stampCalcQuestion(q)
  const modeId = (stamped.mode === 'mix'
    ? inferCalcContentMode(stamped)
    : stamped.mode) as CalcPlayMode
  return {
    skillId: 'calc',
    modeId,
    difficulty: stamped.difficulty,
    question: stamped,
  }
}

function inferCalcContentMode(q: CalcQuestion): string {
  const head = q.id.split('-')[0]
  if (head === 'add') return 'add'
  if (head === 'sub') return 'sub'
  if (head === 'dbl') return 'doubles'
  if (head === 'half') return 'halves'
  if (head === 'miss') return 'missing'
  if (head === 'n10' || head === 'n100') return 'near10'
  if (head === 'cmp') return 'compare'
  if (head === 'ord') return 'order'
  if (head === 'tf') return 'truefalse'
  return q.mode
}

export function buildMoneyMissPayload(q: MoneyQuestion): MoneyMissPayload {
  return {
    skillId: 'money',
    modeId: q.mode,
    question: q,
  }
}

export function buildClockMissPayload(
  q: ClockMcqQuestion,
  lang: ClockLang,
): ClockMissPayload {
  const stamped = stampClockQuestion(q, lang)
  return {
    skillId: 'clocks',
    modeId: stamped.kind === 'convert24' ? 'convert24' : 'read',
    lang,
    question: stamped,
  }
}

export function questionIdFromPayload(payload: MathsMissPayload): string {
  switch (payload.skillId) {
    case 'calc':
      return calcQuestionId(payload.question)
    case 'money':
      return moneyQuestionId(payload.question)
    case 'clocks':
      return clockQuestionId(payload.question, payload.lang)
  }
}
