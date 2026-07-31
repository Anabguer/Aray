import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { CrateActivityKey } from '@/config/crateConfig'
import {
  applyAlphabetSessionToProgress,
  type AlphabetAnswerRecord,
  type AlphabetSessionResult,
} from '@/alphabet/progress'
import type { AlphabetPlayMode } from '@/alphabet/types'
import {
  chooseCrateOption,
  collectPendingCrate,
  markCrateOpened,
  rollCrateForCompletion,
  type CratesState,
} from '@/crates/engine'
import { applyCrateRewardToProgress } from '@/crates/apply'
import { postCrateChoose, postCrateClaim, postCrateOpen } from '@/crates/api'
import type { ActivityAssignmentMap, SchoolProfile } from '@/curriculum/types'
import type { ProgressState, RewardProgress, SessionResult } from '@/math/types'
import {
  applySessionToProgress,
  createInitialProgress,
  createLocalStorageProgressStore,
  PROGRESS_STORAGE_KEY,
  type ProgressStore,
} from '@/progress/repository'
import { soundEngine } from '@/sound/soundEngine'
import { achievementCatalog, achievementIsUnlocked } from '@/achievements/catalog'
import { SYNC_META_KEY } from '@/sync/constants'
import {
  clearProgressCache as clearSyncProgressCache,
  currentLocalEpoch,
  loadSyncMeta,
  pendingCount,
  purgeStaleLocalSync,
  saveSyncMeta,
} from '@/sync/pendingQueue'
import {
  enqueueAndSyncRewardGrant,
  flushPendingRewardGrants,
  purgeStaleRewardGrantPending,
  rewardGrantPendingCount,
  type ActivityEnergyGrant,
} from '@/sync/rewardGrantSync'
import { grantRewardPoints } from '@/reward/engine'
import {
  buildSessionPayload,
  enqueueAndSyncSession,
  flushPendingSessions,
  hydrateOfficialProgress,
  type SyncStatus,
} from '@/sync/syncEngine'
import {
  alphabetPendingCount,
  enqueueAndSyncAlphabetSession,
  flushPendingAlphabetSessions,
  purgeStaleAlphabetPending,
} from '@/sync/alphabetSync'
import { mapServerProgressToState, type ServerProgressSnapshot } from '@/sync/mapServerProgress'

interface ProgressContextValue {
  progress: ProgressState
  syncStatus: SyncStatus
  syncError: string | null
  playerId: number | null
  pendingSyncCount: number
  hydrated: boolean
  applySession: (
    partial: Omit<
      SessionResult,
      | 'xpEarned'
      | 'coinsEarned'
      | 'personalBest'
      | 'missedFacts'
      | 'rewardPointsEarned'
      | 'rewardPointsRequested'
      | 'rewardDailyComplete'
      | 'rewardGoalJustCompleted'
      | 'rewardDailyPoints'
      | 'rewardPointsTotal'
    > & {
      missedFacts?: SessionResult['missedFacts']
      sessionId: string
      crateActivity?: CrateActivityKey
      isMissionOfDay?: boolean
      missionCode?: string
    },
  ) => SessionResult
  applyAlphabetSession: (input: {
    mode: AlphabetPlayMode
    answers: AlphabetAnswerRecord[]
    sessionId: string
    bestStreakInRound: number
  }) => AlphabetSessionResult
  /** Concede energía (local + MySQL vía reward-grant). Respeta dailyCap. */
  grantActivityEnergy: (input: ActivityEnergyGrant) => { granted: number }
  refreshFromServer: () => Promise<void>
  flushSyncQueue: () => Promise<void>
  resetProgress: () => void
  setSoundMuted: (muted: boolean) => void
  updateReward: (reward: RewardProgress) => void
  updateCrates: (crates: CratesState) => void
  updateSchool: (school: SchoolProfile) => void
  setActivityAssignments: (assignments: ActivityAssignmentMap) => void
  chooseCrate: (index: number) => void
  openCrate: () => void
  collectCrate: () => string | null
  claimAchievement: (achievementId: string) => boolean
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

const defaultStore = createLocalStorageProgressStore()

function detectNewlyMastered(
  before: ProgressState,
  after: ProgressState,
  tables: number[],
): string | null {
  for (const t of tables) {
    const key = String(t)
    const prev = before.tables[key]
    const next = after.tables[key]
    if (next?.everMastered && !prev?.everMastered) return key
  }
  return null
}

function clearProgressCache(): void {
  clearSyncProgressCache(PROGRESS_STORAGE_KEY)
}

function mapIfNeeded(snapshot: ServerProgressSnapshot, latest: ProgressState): ProgressState {
  return {
    ...mapServerProgressToState(snapshot, {
      soundMuted: latest.soundMuted,
      achievements: latest.achievements,
      celebratedPendingCycles: latest.reward.celebratedPendingCycles,
      alphabet: latest.alphabet,
    }),
  }
}

export function ProgressProvider({
  children,
  store = defaultStore,
  /** Tests: no hidratar de red. */
  skipHydration = false,
}: {
  children: ReactNode
  store?: ProgressStore
  skipHydration?: boolean
}) {
  const [progress, setProgress] = useState<ProgressState>(() => createInitialProgress())
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(skipHydration ? 'ready' : 'hydrating')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [playerId, setPlayerId] = useState<number | null>(null)
  const [syncEpoch, setSyncEpoch] = useState(() => currentLocalEpoch())
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const [hydrated, setHydrated] = useState(skipHydration)
  const progressRef = useRef(progress)
  progressRef.current = progress
  const playerIdRef = useRef(playerId)
  playerIdRef.current = playerId
  const syncEpochRef = useRef(syncEpoch)
  syncEpochRef.current = syncEpoch
  const syncingRef = useRef(false)

  const persistCache = useCallback(
    (next: ProgressState) => {
      setProgress(next)
      progressRef.current = next
      // Caché local únicamente — nunca fuente oficial
      store.save(next)
    },
    [store],
  )

  const refreshPendingCount = useCallback(() => {
    const epoch = syncEpochRef.current
    setPendingSyncCount(pendingCount(epoch) + alphabetPendingCount(epoch) + rewardGrantPendingCount(epoch))
  }, [])

  const applyOfficial = useCallback(
    (next: ProgressState, id: number | null, epoch: number) => {
      persistCache(next)
      setSyncEpoch(epoch)
      syncEpochRef.current = epoch
      if (id !== null) {
        setPlayerId(id)
        playerIdRef.current = id
        saveSyncMeta({
          epoch,
          playerId: id,
          lastHydratedAt: new Date().toISOString(),
        })
      }
      refreshPendingCount()
    },
    [persistCache, refreshPendingCount],
  )

  const refreshFromServer = useCallback(async () => {
    setSyncStatus('hydrating')
    setSyncError(null)
    const current = progressRef.current
    const result = await hydrateOfficialProgress({
      soundMuted: current.soundMuted,
      achievements: current.achievements,
      celebratedPendingCycles: current.reward.celebratedPendingCycles,
    })

    setSyncEpoch(result.syncEpoch)
    syncEpochRef.current = result.syncEpoch

    if (result.progress) {
      applyOfficial(result.progress, result.playerId, result.syncEpoch)
      setSyncStatus(result.status === 'ready' ? 'ready' : result.status)
      setHydrated(true)
      return
    }

    if (result.status === 'needs_device') {
      clearProgressCache()
      purgeStaleLocalSync(result.syncEpoch, null)
      persistCache(createInitialProgress())
      setPlayerId(null)
      setSyncStatus('needs_device')
      setHydrated(true)
      return
    }

    if (result.status === 'offline') {
      const meta = loadSyncMeta()
      if (meta.epoch === result.syncEpoch) {
        const cached = store.load()
        persistCache(cached)
        setPlayerId(meta.playerId)
      } else {
        clearProgressCache()
        persistCache(createInitialProgress())
      }
      setSyncStatus('offline')
      setHydrated(true)
      refreshPendingCount()
      return
    }

    setSyncError(result.error)
    setSyncStatus('error')
    setHydrated(true)
  }, [applyOfficial, persistCache, refreshPendingCount, store])

  const flushSyncQueue = useCallback(async () => {
    const id = playerIdRef.current
    if (!id || syncingRef.current) return
    syncingRef.current = true
    setSyncStatus('syncing')
    try {
      purgeStaleAlphabetPending(syncEpochRef.current, id)
      purgeStaleRewardGrantPending(syncEpochRef.current, id)
      const result = await flushPendingSessions(id)
      const abcResult = await flushPendingAlphabetSessions(id)
      const energyResult = await flushPendingRewardGrants(
        id,
        progressRef.current.reward.appliedSessionIds,
        progressRef.current.reward,
      )
      const official = abcResult.progress ?? result.progress
      if (official || energyResult.reward) {
        const current = progressRef.current
        const base = official
          ? {
              ...official,
              soundMuted: current.soundMuted,
              achievements: current.achievements,
              reward: {
                ...official.reward,
                celebratedPendingCycles: current.reward.celebratedPendingCycles.filter((n) =>
                  official.reward.pendingCycleNumbers.includes(n),
                ),
              },
            }
          : current
        const reward = energyResult.reward
          ? {
              ...energyResult.reward,
              celebratedPendingCycles: base.reward.celebratedPendingCycles.filter((n) =>
                energyResult.reward!.pendingCycleNumbers.includes(n),
              ),
              appliedSessionIds: Array.from(
                new Set([...base.reward.appliedSessionIds, ...energyResult.reward.appliedSessionIds]),
              ),
            }
          : base.reward
        if (official) {
          applyOfficial({ ...base, reward }, id, syncEpochRef.current)
        } else {
          persistCache({ ...current, reward })
        }
      }
      refreshPendingCount()
      const err = energyResult.error ?? abcResult.error ?? result.error
      const synced = result.synced || abcResult.synced || Boolean(energyResult.reward)
      setSyncStatus(err && !synced ? 'offline' : 'ready')
      if (err && !synced) setSyncError(err)
      else setSyncError(null)
    } finally {
      syncingRef.current = false
    }
  }, [applyOfficial, persistCache, refreshPendingCount])

  useEffect(() => {
    if (skipHydration) {
      // Tests: estado inicial vacío en memoria; no leer progreso de prueba del navegador
      setProgress(createInitialProgress())
      setHydrated(true)
      return
    }
    void refreshFromServer()
  }, [refreshFromServer, skipHydration])

  useEffect(() => {
    if (skipHydration) return
    const onOnline = () => {
      void (async () => {
        await refreshFromServer()
        await flushSyncQueue()
      })()
    }
    window.addEventListener('online', onOnline)
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        void flushSyncQueue()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [flushSyncQueue, refreshFromServer, skipHydration])

  useEffect(() => {
    // Preferir prefs locales de audio (música/SFX); alinear progress.soundMuted
    const prefs = soundEngine.getPrefs()
    const muted = !prefs.sfxEnabled
    if (progressRef.current.soundMuted !== muted) {
      persistCache({ ...progressRef.current, soundMuted: muted })
    }
  }, [persistCache])

  const applySession = useCallback(
    (
      partial: Omit<
        SessionResult,
        | 'xpEarned'
        | 'coinsEarned'
        | 'personalBest'
        | 'missedFacts'
        | 'rewardPointsEarned'
        | 'rewardPointsRequested'
        | 'rewardDailyComplete'
        | 'rewardGoalJustCompleted'
        | 'rewardDailyPoints'
        | 'rewardPointsTotal'
      > & {
        missedFacts?: SessionResult['missedFacts']
        sessionId: string
        crateActivity?: CrateActivityKey
        isMissionOfDay?: boolean
        missionCode?: string
      },
    ) => {
      const current = progressRef.current
      const { next, result } = applySessionToProgress(current, partial)

      const answered = partial.answers.length > 0
      const skipCrate = partial.mode === 'learn' || !answered

      let withCrates = next
      if (!skipCrate) {
        const activity: CrateActivityKey =
          partial.crateActivity ??
          (partial.mode === 'challenge'
            ? 'challenge'
            : partial.mode === 'match'
              ? 'match'
              : partial.mode === 'misses'
                ? 'misses'
                : 'train')

        const newlyMastered = detectNewlyMastered(current, next, partial.tables)
        const roll = rollCrateForCompletion({
          completionId: partial.sessionId,
          activity,
          crates: next.crates,
          newlyMasteredTable: newlyMastered,
          isMissionOfDay: partial.isMissionOfDay,
        })
        withCrates = { ...next, crates: roll.crates }
      }

      // Optimista en caché; MySQL manda tras sync
      persistCache(withCrates)

      const id = playerIdRef.current
      if (id !== null && answered) {
        const payload = buildSessionPayload({
          sessionId: partial.sessionId,
          mode: partial.mode,
          tables: partial.tables,
          answers: partial.answers,
          clientStartedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
          syncEpoch: syncEpochRef.current,
          isMissionOfDay: partial.isMissionOfDay,
          missionCode: partial.missionCode,
        })
        void (async () => {
          setSyncStatus('syncing')
          const syncResult = await enqueueAndSyncSession({ playerId: id, payload })
          refreshPendingCount()
          if (syncResult.progress) {
            const latest = progressRef.current
            applyOfficial(
              {
                ...syncResult.progress,
                soundMuted: latest.soundMuted,
                achievements: latest.achievements,
                // Cajas oficiales del servidor (pending + pity)
                reward: {
                  ...syncResult.progress.reward,
                  celebratedPendingCycles: latest.reward.celebratedPendingCycles.filter((n) =>
                    syncResult.progress!.reward.pendingCycleNumbers.includes(n),
                  ),
                },
              },
              id,
              syncEpochRef.current,
            )
            setSyncStatus('ready')
            setSyncError(null)
          } else {
            setSyncStatus(syncResult.error ? 'offline' : 'ready')
            setSyncError(syncResult.error)
          }
        })()
      } else if (answered) {
        // Sin dispositivo: no inventar progreso oficial; dejar optimista y marcar needs_device
        setSyncStatus('needs_device')
      }

      return result
    },
    [applyOfficial, persistCache, refreshPendingCount],
  )

  const applyAlphabetSession = useCallback(
    (input: {
      mode: AlphabetPlayMode
      answers: AlphabetAnswerRecord[]
      sessionId: string
      bestStreakInRound: number
    }) => {
      const current = progressRef.current
      const { next, result } = applyAlphabetSessionToProgress(current, input)
      persistCache(next)

      const answered = input.answers.length > 0
      const id = playerIdRef.current
      if (id !== null && answered) {
        const payload = {
          sessionId: input.sessionId,
          mode: input.mode,
          answers: input.answers,
          bestStreakInRound: input.bestStreakInRound,
          syncEpoch: syncEpochRef.current,
        }
        void (async () => {
          setSyncStatus('syncing')
          const syncResult = await enqueueAndSyncAlphabetSession({ playerId: id, payload })
          refreshPendingCount()
          if (syncResult.progress) {
            const latest = progressRef.current
            applyOfficial(
              {
                ...syncResult.progress,
                soundMuted: latest.soundMuted,
                achievements: latest.achievements,
                reward: {
                  ...syncResult.progress.reward,
                  celebratedPendingCycles: latest.reward.celebratedPendingCycles.filter((n) =>
                    syncResult.progress!.reward.pendingCycleNumbers.includes(n),
                  ),
                },
              },
              id,
              syncEpochRef.current,
            )
            setSyncStatus('ready')
            setSyncError(null)
          } else {
            setSyncStatus(syncResult.error ? 'offline' : 'ready')
            setSyncError(syncResult.error)
          }
        })()
      } else if (answered) {
        setSyncStatus('needs_device')
      }

      return result
    },
    [applyOfficial, persistCache, refreshPendingCount],
  )

  const grantActivityEnergy = useCallback(
    (input: ActivityEnergyGrant) => {
      const requested = Math.max(0, Math.floor(input.requestedPoints))
      if (requested <= 0 || !input.sessionId) return { granted: 0 }

      const current = progressRef.current
      const localGrant = grantRewardPoints(current.reward, {
        requestedPoints: requested,
        sessionId: input.sessionId,
        attemptIds: [input.sessionId],
      })
      persistCache({ ...current, reward: localGrant.reward })

      const id = playerIdRef.current
      if (id !== null) {
        void (async () => {
          setSyncStatus('syncing')
          const syncResult = await enqueueAndSyncRewardGrant({
            playerId: id,
            grant: { ...input, requestedPoints: requested },
            appliedSessionIds: localGrant.reward.appliedSessionIds,
            localReward: localGrant.reward,
          })
          refreshPendingCount()
          if (syncResult.reward) {
            const latest = progressRef.current
            persistCache({
              ...latest,
              reward: {
                ...syncResult.reward,
                celebratedPendingCycles: latest.reward.celebratedPendingCycles.filter((n) =>
                  syncResult.reward!.pendingCycleNumbers.includes(n),
                ),
                appliedSessionIds: Array.from(
                  new Set([
                    ...latest.reward.appliedSessionIds,
                    ...syncResult.reward.appliedSessionIds,
                    input.sessionId,
                  ]),
                ),
              },
            })
            setSyncStatus('ready')
            setSyncError(null)
          } else {
            setSyncStatus(syncResult.error ? 'offline' : 'ready')
            setSyncError(syncResult.error)
          }
        })()
      } else {
        setSyncStatus('needs_device')
      }

      return { granted: localGrant.granted }
    },
    [persistCache, refreshPendingCount],
  )

  const resetProgress = useCallback(() => {
    // Solo limpia caché local; el oficial vive en MySQL (panel/scripts)
    clearProgressCache()
    localStorage.removeItem(SYNC_META_KEY)
    const fresh = createInitialProgress()
    fresh.soundMuted = progressRef.current.soundMuted
    persistCache(fresh)
    void refreshFromServer()
  }, [persistCache, refreshFromServer])

  const setSoundMuted = useCallback(
    (muted: boolean) => {
      persistCache({ ...progressRef.current, soundMuted: muted })
      soundEngine.setMuted(muted)
    },
    [persistCache],
  )

  const updateReward = useCallback(
    (reward: RewardProgress) => {
      persistCache({ ...progressRef.current, reward })
    },
    [persistCache],
  )

  const updateCrates = useCallback(
    (crates: CratesState) => {
      persistCache({ ...progressRef.current, crates })
    },
    [persistCache],
  )

  const updateSchool = useCallback(
    (school: SchoolProfile) => {
      persistCache({ ...progressRef.current, school })
    },
    [persistCache],
  )

  const setActivityAssignments = useCallback(
    (activityAssignments: ActivityAssignmentMap) => {
      persistCache({ ...progressRef.current, activityAssignments })
    },
    [persistCache],
  )

  const chooseCrate = useCallback(
    (index: number) => {
      const current = progressRef.current
      const completionId = current.crates.pending?.completionId
      persistCache({ ...current, crates: chooseCrateOption(current.crates, index) })
      const id = playerIdRef.current
      if (id !== null && completionId) {
        void postCrateChoose(completionId, index)
          .then((res) => {
            if (res.progress) {
              const latest = progressRef.current
              applyOfficial(
                {
                  ...mapIfNeeded(res.progress, latest),
                },
                id,
                syncEpochRef.current,
              )
            }
          })
          .catch(() => {
            /* offline: se queda el optimista */
          })
      }
    },
    [applyOfficial, persistCache],
  )

  const openCrate = useCallback(() => {
    const current = progressRef.current
    const completionId = current.crates.pending?.completionId
    persistCache({ ...current, crates: markCrateOpened(current.crates) })
    const id = playerIdRef.current
    if (id !== null && completionId) {
      void postCrateOpen(completionId)
        .then((res) => {
          if (res.progress) {
            const latest = progressRef.current
            applyOfficial(mapIfNeeded(res.progress, latest), id, syncEpochRef.current)
          }
        })
        .catch(() => {})
    }
  }, [applyOfficial, persistCache])

  const collectCrate = useCallback(() => {
    const current = progressRef.current
    const completionId = current.crates.pending?.completionId
    const collected = collectPendingCrate(current.crates)
    if (!collected.applied || !collected.reward) {
      if (collected.crates !== current.crates) persistCache({ ...current, crates: collected.crates })
      return null
    }
    const applied = applyCrateRewardToProgress(
      { ...current, crates: collected.crates },
      collected.reward,
    )
    persistCache(applied.next)

    const id = playerIdRef.current
    if (id !== null && completionId) {
      void postCrateClaim(completionId)
        .then((res) => {
          if (res.progress) {
            const latest = progressRef.current
            applyOfficial(mapIfNeeded(res.progress, latest), id, syncEpochRef.current)
          }
        })
        .catch(() => {})
    }
    return applied.adjustmentNote
  }, [applyOfficial, persistCache])

  const claimAchievement = useCallback(
    (achievementId: string) => {
      const current = progressRef.current
      const achievement = achievementCatalog.find((item) => item.id === achievementId)
      if (!achievement || !achievementIsUnlocked(achievement, current)) return false
      if (current.achievements.claimedIds.includes(achievementId)) return false

      // Solo marca local; XP/monedas oficiales vienen del servidor
      persistCache({
        ...current,
        achievements: {
          claimedIds: [...current.achievements.claimedIds, achievementId],
        },
      })
      return true
    },
    [persistCache],
  )

  const value = useMemo(
    () => ({
      progress,
      syncStatus,
      syncError,
      playerId,
      pendingSyncCount,
      hydrated,
      applySession,
      applyAlphabetSession,
      grantActivityEnergy,
      refreshFromServer,
      flushSyncQueue,
      resetProgress,
      setSoundMuted,
      updateReward,
      updateCrates,
      updateSchool,
      setActivityAssignments,
      chooseCrate,
      openCrate,
      collectCrate,
      claimAchievement,
    }),
    [
      progress,
      syncStatus,
      syncError,
      playerId,
      pendingSyncCount,
      hydrated,
      applySession,
      applyAlphabetSession,
      grantActivityEnergy,
      refreshFromServer,
      flushSyncQueue,
      resetProgress,
      setSoundMuted,
      updateReward,
      updateCrates,
      updateSchool,
      setActivityAssignments,
      chooseCrate,
      openCrate,
      collectCrate,
      claimAchievement,
    ],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress debe usarse dentro de ProgressProvider')
  return ctx
}
