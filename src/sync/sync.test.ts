import { beforeEach, describe, expect, it } from 'vitest'
import { ARAY_DATA_EPOCH_FALLBACK } from '@/sync/constants'
import {
  enqueuePendingSession,
  loadPendingSessions,
  purgeStaleLocalSync,
  removePendingSession,
  savePendingSessions,
} from '@/sync/pendingQueue'
import { mapServerProgressToState } from '@/sync/mapServerProgress'

beforeEach(() => {
  localStorage.clear()
})

describe('pendingQueue', () => {
  it('no duplica la misma sessionId', () => {
    const payload = {
      sessionId: 's1',
      mode: 'train',
      tables: [3],
      answers: [{ attemptId: 'a1', a: 3, b: 4, selected: 12 }],
      syncEpoch: ARAY_DATA_EPOCH_FALLBACK,
    }
    enqueuePendingSession({
      sessionId: 's1',
      epoch: ARAY_DATA_EPOCH_FALLBACK,
      playerId: 1,
      createdAt: '2026-07-30T10:00:00Z',
      payload,
    })
    enqueuePendingSession({
      sessionId: 's1',
      epoch: ARAY_DATA_EPOCH_FALLBACK,
      playerId: 1,
      createdAt: '2026-07-30T10:01:00Z',
      payload,
    })
    expect(loadPendingSessions()).toHaveLength(1)
  })

  it('solo elimina tras confirmación explícita', () => {
    enqueuePendingSession({
      sessionId: 's2',
      epoch: ARAY_DATA_EPOCH_FALLBACK,
      playerId: 1,
      createdAt: '2026-07-30T10:00:00Z',
      payload: {
        sessionId: 's2',
        mode: 'train',
        tables: [2],
        answers: [],
        syncEpoch: ARAY_DATA_EPOCH_FALLBACK,
      },
    })
    expect(loadPendingSessions()).toHaveLength(1)
    removePendingSession('s2')
    expect(loadPendingSessions()).toHaveLength(0)
  })

  it('descarta operaciones de epoch anterior al servidor', () => {
    savePendingSessions([
      {
        id: 'old',
        sessionId: 'old-s',
        epoch: 1,
        playerId: 1,
        createdAt: '2026-07-01T00:00:00Z',
        attempts: 1,
        lastError: null,
        payload: {
          sessionId: 'old-s',
          mode: 'train',
          tables: [1],
          answers: [],
          syncEpoch: 1,
        },
      },
      {
        id: 'new',
        sessionId: 'new-s',
        epoch: 2,
        playerId: 1,
        createdAt: '2026-07-30T00:00:00Z',
        attempts: 0,
        lastError: null,
        payload: {
          sessionId: 'new-s',
          mode: 'train',
          tables: [1],
          answers: [],
          syncEpoch: 2,
        },
      },
    ])
    const result = purgeStaleLocalSync(2, 1)
    expect(result.purgedOps).toBe(1)
    expect(result.epochChanged).toBe(true)
    expect(loadPendingSessions().map((o) => o.sessionId)).toEqual(['new-s'])
  })

  it('al hidratar un niño no borra la cola offline del hermano', () => {
    savePendingSessions([
      {
        id: 'a',
        sessionId: 'sib-a',
        epoch: 2,
        playerId: 4,
        createdAt: '2026-07-31T10:00:00Z',
        attempts: 0,
        lastError: null,
        payload: {
          sessionId: 'sib-a',
          mode: 'train',
          tables: [2],
          answers: [],
          syncEpoch: 2,
        },
      },
      {
        id: 'b',
        sessionId: 'sib-b',
        epoch: 2,
        playerId: 5,
        createdAt: '2026-07-31T10:01:00Z',
        attempts: 0,
        lastError: null,
        payload: {
          sessionId: 'sib-b',
          mode: 'train',
          tables: [3],
          answers: [],
          syncEpoch: 2,
        },
      },
    ])
    const result = purgeStaleLocalSync(2, 5)
    expect(result.purgedOps).toBe(0)
    expect(loadPendingSessions().map((o) => o.sessionId).sort()).toEqual(['sib-a', 'sib-b'])
  })
})

describe('mapServerProgressToState', () => {
  it('usa XP/monedas del servidor sin inventar demo', () => {
    const state = mapServerProgressToState({
      xp: 440,
      coins: 42,
      bestStreak: 5,
      syncEpoch: 1,
      facts: { '3x7': { attempts: 2, correct: 2, wrong: 0, weight: 1, lastSeenAt: null } },
      tables: { '3': { practiced: true, attempts: 2, correct: 2, masteryScore: 100 } },
      reward: {
        pointsTotal: 10,
        dailyPoints: 2,
        dailyDate: '2026-07-30',
        goalStatus: 'active',
        currentCycleNumber: 1,
      },
    })
    expect(state.xp).toBe(440)
    expect(state.coins).toBe(42)
    expect(state.facts['3x7']?.correct).toBe(2)
    expect(state.tables['3']?.masteryScore).toBe(100)
  })

  it('fusiona claimedIds de colección del servidor con los locales', () => {
    const state = mapServerProgressToState(
      {
        xp: 0,
        coins: 0,
        achievements: { claimedIds: ['primera-mision', 'racha-5'] },
      },
      { achievements: { claimedIds: ['racha-5', 'tabla-2'] } },
    )
    expect(state.achievements.claimedIds.sort()).toEqual(
      ['primera-mision', 'racha-5', 'tabla-2'].sort(),
    )
  })

  it('lee activityAssignments anidadas en school', () => {
    const state = mapServerProgressToState({
      xp: 0,
      school: {
        currentCourseId: 'primary-3',
        courseMode: 'review',
        courseStartedAt: '2026-01-01T00:00:00.000Z',
        history: [],
        activityAssignments: {
          'tables-train-3': 'mandatory',
          'calc-mix': 'hidden',
        },
      },
    })
    expect(state.activityAssignments['tables-train-3']).toBe('mandatory')
    expect(state.activityAssignments['calc-mix']).toBe('hidden')
  })
})
