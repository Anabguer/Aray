import { describe, expect, it } from 'vitest'
import { rewardRules } from '@/config/rewards'
import { xpDeltaForAnswer, sessionXpEarned, baseXpPerCorrect } from '@/feedback/xpPreview'
import { sessionLeveledUp, isPerfectSession } from '@/feedback/sessionOutcome'
import type { SessionAnswer } from '@/math/types'
import { makeFact } from '@/math/tables'
import { newId } from '@/progress/repository'

function ans(correct: boolean, firstTry = true): SessionAnswer {
  return {
    fact: makeFact(3, 4),
    correct,
    selected: correct ? 12 : 0,
    elapsedMs: 0,
    attemptId: newId('ans'),
    firstTry,
  }
}

describe('xpPreview mirrors rewardRules', () => {
  it('da xpPerCorrect por acierto en train', () => {
    const a = ans(true)
    expect(xpDeltaForAnswer('train', [], a)).toBe(rewardRules.xpPerCorrect)
    expect(baseXpPerCorrect('train')).toBe(10)
    expect(baseXpPerCorrect('challenge')).toBe(20)
  })

  it('añade bonus de racha cada 5 a la primera', () => {
    const prev = [ans(true), ans(true), ans(true), ans(true)]
    const fifth = ans(true)
    expect(xpDeltaForAnswer('train', prev, fifth)).toBe(
      rewardRules.xpPerCorrect + rewardRules.xpStreakBonus,
    )
  })

  it('no resta XP al fallar', () => {
    const miss = ans(false)
    expect(xpDeltaForAnswer('train', [ans(true)], miss)).toBe(0)
    expect(sessionXpEarned('train', [ans(true), miss])).toBe(rewardRules.xpPerCorrect)
  })

  it('detecta subida de nivel y sesión perfecta', () => {
    expect(sessionLeveledUp(95, 10)).toEqual({ leveledUp: true, newLevel: 2 })
    expect(sessionLeveledUp(10, 10)).toEqual({ leveledUp: false, newLevel: 1 })
    expect(isPerfectSession([ans(true), ans(true)])).toBe(true)
    expect(isPerfectSession([ans(true), ans(false)])).toBe(false)
  })
})
