import { describe, expect, it } from 'vitest'
import {
  applyEvaluableRound,
  emptyTableProgress,
  evaluateTableRoundScore,
  normalizeTableProgress,
  tableRoundConfig,
  tableStatus,
} from '@/math/tableMastery'
import { makeFact } from '@/math/tables'
import type { SessionAnswer } from '@/math/types'
import { applySessionToProgress, createInitialProgress } from '@/progress/repository'

function trainAnswers(table: number, firstTryCorrectCount: number): SessionAnswer[] {
  const answers: SessionAnswer[] = []
  for (let b = 1; b <= 10; b += 1) {
    const fact = makeFact(table, b)
    const firstTry = b <= firstTryCorrectCount
    if (!firstTry) {
      answers.push({
        fact,
        correct: false,
        selected: fact.product + 1,
        elapsedMs: 10,
        attemptId: `m-${table}-${b}`,
        firstTry: false,
      })
    }
    answers.push({
      fact,
      correct: true,
      selected: fact.product,
      elapsedMs: 10,
      attemptId: `ok-${table}-${b}`,
      firstTry,
    })
  }
  return answers
}

describe('dominio de tabla: Domada y repaso', () => {
  it('evalúa ronda /10 a la primera', () => {
    expect(evaluateTableRoundScore(trainAnswers(7, 8), 7)).toBe(8)
    expect(evaluateTableRoundScore(trainAnswers(7, 7), 7)).toBe(7)
    expect(evaluateTableRoundScore(trainAnswers(7, 8).slice(0, 4), 7)).toBeNull()
  })

  it('una ronda baja no quita Domada; muestra conviene repasar', () => {
    let t = emptyTableProgress()
    t = applyEvaluableRound(t, 9)
    expect(tableStatus(t).label).toBe('¡Domada!')
    expect(t.everMastered).toBe(true)
    expect(t.bestRoundScore).toBe(9)

    t = applyEvaluableRound(t, 6)
    expect(t.everMastered).toBe(true)
    expect(t.bestRoundScore).toBe(9)
    expect(t.lastRoundScore).toBe(6)
    expect(t.consecutiveLowRounds).toBe(1)
    expect(tableStatus(t).label).toBe('Domada · Conviene repasar')
    expect(tableStatus(t).recommendPractice).toBe(true)
  })

  it('dos rondas bajas consecutivas pasan a Necesita entreno', () => {
    let t = applyEvaluableRound(emptyTableProgress(), 10)
    t = applyEvaluableRound(t, 5)
    t = applyEvaluableRound(t, 4)
    expect(t.consecutiveLowRounds).toBe(2)
    expect(t.everMastered).toBe(true)
    expect(tableStatus(t).label).toBe('Necesita entreno')
    expect(tableStatus(t).recommendPractice).toBe(true)
  })

  it('un 8/10 limpia el aviso de repaso', () => {
    let t = applyEvaluableRound(emptyTableProgress(), 9)
    t = applyEvaluableRound(t, 5)
    expect(tableStatus(t).kind).toBe('mastered_review')
    t = applyEvaluableRound(t, 8)
    expect(t.consecutiveLowRounds).toBe(0)
    expect(t.lastRoundScore).toBe(8)
    expect(tableStatus(t).label).toBe('¡Domada!')
    expect(tableStatus(t).recommendPractice).toBe(false)
  })

  it('persiste best/last/low streak por separado', () => {
    let t = applyEvaluableRound(emptyTableProgress(), 10)
    t = applyEvaluableRound(t, 3)
    expect(t.bestRoundScore).toBe(10)
    expect(t.lastRoundScore).toBe(3)
    expect(t.consecutiveLowRounds).toBe(1)
  })

  it('migra tablas antiguas sin perder Domada por masteryScore', () => {
    const migrated = normalizeTableProgress({
      practiced: true,
      attempts: 20,
      correct: 18,
      masteryScore: 85,
      lastPracticedAt: null,
    })
    expect(migrated.everMastered).toBe(true)
    expect(migrated.bestRoundScore).toBe(tableRoundConfig.passScore)
    expect(tableStatus(migrated).kind).toBe('mastered')
  })

  it('applySession conserva Domada tras una ronda mala', () => {
    let progress = createInitialProgress()
    const good = applySessionToProgress(progress, {
      mode: 'train',
      tables: [6],
      score: 9,
      bestStreak: 5,
      sessionId: 'dom-1',
      answers: trainAnswers(6, 9),
    })
    expect(good.next.tables['6'].everMastered).toBe(true)
    expect(tableStatus(good.next.tables['6']).label).toBe('¡Domada!')

    const bad = applySessionToProgress(good.next, {
      mode: 'train',
      tables: [6],
      score: 5,
      bestStreak: 0,
      sessionId: 'dom-2',
      answers: trainAnswers(6, 5),
    })
    const table = bad.next.tables['6']
    expect(table.everMastered).toBe(true)
    expect(table.bestRoundScore).toBe(9)
    expect(table.lastRoundScore).toBe(5)
    expect(table.consecutiveLowRounds).toBe(1)
    expect(tableStatus(table).label).toBe('Domada · Conviene repasar')
  })
})
