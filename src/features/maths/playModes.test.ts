import { describe, expect, it, beforeEach } from 'vitest'
import { learnLayout, learnUnitSizePx, PLAYABLE_TABLES } from '@/config/playConfig'
import { hasSavedMisses, listRandomMissions, pickRandomMission } from '@/math/randomMission'
import { createInitialProgress } from '@/progress/repository'
import { applySessionToProgress, calculateSessionRewards } from '@/progress/repository'
import { makeFact } from '@/math/tables'
import { buildMatchPairs } from '@/math/match'
import type { SessionAnswer } from '@/math/types'
import { challengeModeConfig } from '@/config/playConfig'

function ans(
  a: number,
  b: number,
  correct: boolean,
  id: string,
  firstTry?: boolean,
): SessionAnswer {
  return {
    fact: makeFact(a, b),
    correct,
    selected: correct ? a * b : a * b + 1,
    elapsedMs: 40,
    attemptId: id,
    firstTry,
  }
}

describe('Aprende: tamaño de unidades', () => {
  it('respeta min/max y no genera cuadrados gigantes', () => {
    const small = learnUnitSizePx(6, 3)
    const large = learnUnitSizePx(90, 9)
    expect(small).toBeLessThanOrEqual(learnLayout.unitMaxPx)
    expect(small).toBeGreaterThanOrEqual(learnLayout.unitMinPx)
    expect(large).toBeLessThanOrEqual(learnLayout.unitMaxPx)
    expect(large).toBeLessThanOrEqual(small)
  })

  it('cantidades grandes usan unidades más compactas', () => {
    expect(learnUnitSizePx(81, 9)).toBeLessThanOrEqual(learnUnitSizePx(12, 3))
  })
})

describe('Tablas jugables y misión random', () => {
  it('solo expone tablas 2–9', () => {
    expect(PLAYABLE_TABLES).toEqual([2, 3, 4, 5, 6, 7, 8, 9])
    expect(PLAYABLE_TABLES).not.toContain(1)
    expect(PLAYABLE_TABLES).not.toContain(10)
  })

  it('no ofrece fallos si no hay errores guardados', () => {
    const progress = createInitialProgress()
    expect(hasSavedMisses(progress)).toBe(false)
    expect(listRandomMissions(progress).some((m) => m.kind === 'misses')).toBe(false)
  })

  it('incluye fallos y empareja cuando hay datos', () => {
    const progress = createInitialProgress()
    progress.facts['7x8'] = {
      attempts: 2,
      correct: 0,
      wrong: 2,
      weight: 4,
      lastSeenAt: null,
    }
    const list = listRandomMissions(progress)
    expect(list.some((m) => m.kind === 'misses')).toBe(true)
    expect(list.some((m) => m.kind === 'match')).toBe(true)
    expect(pickRandomMission(progress, () => 0)?.kind).toBeDefined()
  })
})

describe('Entrena: reintentos', () => {
  it('varios intentos no duplican energía ni XP de la misma operación', () => {
    const progress = createInitialProgress()
    const { result } = applySessionToProgress(progress, {
      mode: 'train',
      tables: [6],
      score: 1,
      bestStreak: 0,
      sessionId: 'train-retry',
      answers: [ans(6, 7, false, 'm1', false), ans(6, 7, true, 'ok1', false)],
    })
    expect(result.rewardPointsEarned).toBe(5)
    expect(result.xpEarned).toBe(10)
    expect(result.missedFacts).toHaveLength(1)
  })

  it('acierto a la primera mantiene racha; fallo la rompe en el cálculo', () => {
    const rewards = calculateSessionRewards(
      'train',
      [
        ans(2, 2, true, 'a', true),
        ans(2, 3, false, 'b', false),
        ans(2, 3, true, 'c', false),
        ans(2, 4, true, 'd', true),
      ],
      0,
      3,
    )
    expect(rewards.bestStreak).toBe(1)
  })
})

describe('Reto rápido: multiplicadores', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('concede XP ×2; energía de unidad tablas; sin monedas', () => {
    const progress = createInitialProgress()
    const { result, next } = applySessionToProgress(progress, {
      mode: 'challenge',
      tables: [4],
      score: 40,
      bestStreak: 1,
      sessionId: 'chal-x2',
      answers: [ans(4, 4, true, 'c1', true)],
    })
    expect(challengeModeConfig.xpMultiplier).toBe(2)
    expect(challengeModeConfig.rewardMultiplier).toBe(1)
    expect(result.xpEarned).toBe(20)
    expect(result.coinsEarned).toBe(0)
    // 5 (unidad tablas); el Reto ya no suma cupo diario aparte
    expect(result.rewardPointsEarned).toBe(5)
    expect(next.tables['4'].masteryScore).toBeGreaterThan(0)
  })

  it('error no concede ni resta energía/XP de la respuesta', () => {
    const progress = createInitialProgress()
    const { result } = applySessionToProgress(progress, {
      mode: 'challenge',
      tables: [5],
      score: 0,
      bestStreak: 0,
      sessionId: 'chal-miss',
      answers: [ans(5, 5, false, 'w1', true)],
    })
    expect(result.xpEarned).toBe(0)
    expect(result.rewardPointsEarned).toBe(0)
  })

  it('Reto del día del lobby (isMissionOfDay) suma +10 una vez', () => {
    const progress = createInitialProgress()
    const { result } = applySessionToProgress(
      progress,
      {
        mode: 'train',
        tables: [3],
        score: 1,
        bestStreak: 1,
        sessionId: 'daily-chal-1',
        answers: [ans(3, 3, true, 'a', true)],
      },
      undefined,
      { isMissionOfDay: true },
    )
    expect(result.rewardPointsEarned).toBe(15)
  })

  it('respeta tope diario de energía 100', () => {
    let progress = createInitialProgress()
    progress.reward.dailyDate = new Date().toISOString().slice(0, 10)
    progress.reward.dailyPoints = 90
    const { result } = applySessionToProgress(progress, {
      mode: 'challenge',
      tables: [3],
      score: 10,
      bestStreak: 1,
      sessionId: 'chal-cap',
      answers: [ans(3, 3, true, 'a', true), ans(3, 4, true, 'b', true)],
    })
    expect(result.rewardPointsEarned).toBe(10)
    expect(result.rewardDailyPoints).toBe(100)
  })
})

describe('Misión diaria tablas', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('avanza slots de misión tablas al conceder energía', () => {
    const progress = createInitialProgress()
    applySessionToProgress(progress, {
      mode: 'train',
      tables: [2],
      score: 2,
      bestStreak: 1,
      sessionId: 'mission-slots-1',
      answers: [ans(2, 2, true, 'a', true), ans(2, 3, true, 'b', true)],
    })
    const raw = localStorage.getItem('aray.dailyMission.v1')
    expect(raw).toBeTruthy()
    const snap = JSON.parse(raw!) as { progress: { tables: number } }
    expect(snap.progress.tables).toBe(2)
  })
})

describe('Empareja la tabla — recompensa de sesión', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('concede energía por aciertos (slots misión) sin duplicar sesión', () => {
    const progress = createInitialProgress()
    const pairs = buildMatchPairs(2)
    const answers = pairs.flatMap((p, i) => [
      ...(i === 0 ? [ans(p.fact.a, p.fact.b, false, `m${i}`, false)] : []),
      ans(p.fact.a, p.fact.b, true, `ok${i}`, i !== 0),
    ])
    const first = applySessionToProgress(progress, {
      mode: 'match',
      tables: [2],
      score: 9,
      bestStreak: 0,
      sessionId: 'match-1',
      answers,
      missedFacts: [pairs[0].fact],
    })
    // Máx. 6 unidades × 5 = 30
    expect(first.result.rewardPointsEarned).toBe(30)
    expect(first.result.missedFacts).toHaveLength(1)
    const second = applySessionToProgress(first.next, {
      mode: 'match',
      tables: [2],
      score: 9,
      bestStreak: 0,
      sessionId: 'match-1',
      answers,
    })
    expect(second.result.rewardPointsEarned).toBe(0)
    expect(second.result.xpEarned).toBe(0)
  })
})
