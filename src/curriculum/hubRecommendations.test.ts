import { describe, expect, it } from 'vitest'
import {
  hubGuideTip,
  resolveHubZoneStatus,
  zoneNeedsRecommendation,
} from '@/curriculum/hubRecommendations'
import { createInitialProgress } from '@/progress/repository'
import { emptyTableProgress } from '@/math/tableMastery'

describe('hubRecommendations', () => {
  it('no marca todo como recomendado sin señales de debilidad', () => {
    const progress = createInitialProgress()
    expect(zoneNeedsRecommendation(progress, 'tables')).toBe(false)
    expect(zoneNeedsRecommendation(progress, 'calc')).toBe(false)
    expect(zoneNeedsRecommendation(progress, 'alphabet')).toBe(false)

    expect(
      resolveHubZoneStatus(progress, 'tables', {
        playable: true,
        isStarter: true,
        anyWeakInHub: false,
      }),
    ).toBe('recommended')

    expect(
      resolveHubZoneStatus(progress, 'calc', {
        playable: true,
        isStarter: false,
        anyWeakInHub: false,
      }),
    ).toBe('available')
  })

  it('recomienda tablas si hay fallos guardados', () => {
    const progress = createInitialProgress()
    progress.facts['2x3'] = {
      attempts: 2,
      correct: 0,
      wrong: 2,
      weight: 4,
      lastSeenAt: new Date().toISOString(),
    }

    expect(zoneNeedsRecommendation(progress, 'tables')).toBe(true)
    expect(
      resolveHubZoneStatus(progress, 'tables', {
        playable: true,
        isStarter: true,
        anyWeakInHub: true,
      }),
    ).toBe('recommended')
    expect(
      resolveHubZoneStatus(progress, 'calc', {
        playable: true,
        isStarter: false,
        anyWeakInHub: true,
      }),
    ).toBe('available')
  })

  it('recomienda tablas si una tabla pide repaso', () => {
    const progress = createInitialProgress()
    progress.tables['4'] = {
      ...emptyTableProgress(),
      practiced: true,
      everMastered: true,
      bestRoundScore: 9,
      consecutiveLowRounds: 2,
      masteryScore: 90,
    }

    expect(zoneNeedsRecommendation(progress, 'tables')).toBe(true)
  })

  it('recomienda ABC si hay letras falladas', () => {
    const progress = createInitialProgress()
    progress.alphabet = {
      modes: {},
      letters: {
        M: { attempts: 3, correct: 0, wrong: 3, lastSeenAt: null },
      },
      roundsPlayed: 1,
      perfectRounds: 0,
      bestStreak: 0,
    }

    expect(zoneNeedsRecommendation(progress, 'alphabet')).toBe(true)
    expect(zoneNeedsRecommendation(progress, 'spelling')).toBe(false)
  })

  it('respeta overrides adultos por actividad del bloque', () => {
    const progress = createInitialProgress()
    progress.activityAssignments = {
      'calc-mental-mix': 'review',
    }
    expect(zoneNeedsRecommendation(progress, 'calc')).toBe(true)
    expect(zoneNeedsRecommendation(progress, 'money')).toBe(false)
  })

  it('recomienda dinero por override adulto aunque el skill viva en calculation', () => {
    const progress = createInitialProgress()
    progress.activityAssignments = {
      'money-change': 'recommended',
    }
    expect(zoneNeedsRecommendation(progress, 'money')).toBe(true)
    expect(zoneNeedsRecommendation(progress, 'calc')).toBe(false)
  })

  it('elige tip según haya debilidad o solo arranque', () => {
    expect(hubGuideTip({ hasRecommended: true, hasWeak: true })).toBe(
      'Aquí conviene repasar',
    )
    expect(hubGuideTip({ hasRecommended: true, hasWeak: false })).toBe(
      'Empieza por aquí',
    )
    expect(hubGuideTip({ hasRecommended: false, hasWeak: false })).toBeUndefined()
  })
})
