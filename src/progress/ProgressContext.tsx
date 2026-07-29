import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CrateActivityKey } from '@/config/crateConfig'
import {
  chooseCrateOption,
  collectPendingCrate,
  markCrateOpened,
  rollCrateForCompletion,
  type CratesState,
} from '@/crates/engine'
import { applyCrateRewardToProgress } from '@/crates/apply'
import type { ActivityAssignmentMap, SchoolProfile } from '@/curriculum/types'
import type { ProgressState, RewardProgress, SessionResult } from '@/math/types'
import {
  applySessionToProgress,
  createInitialProgress,
  createLocalStorageProgressStore,
  type ProgressStore,
} from '@/progress/repository'
import { soundEngine } from '@/sound/soundEngine'
import { achievementCatalog, achievementIsUnlocked } from '@/achievements/catalog'

interface ProgressContextValue {
  progress: ProgressState
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
    },
  ) => SessionResult
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

export function ProgressProvider({
  children,
  store = defaultStore,
}: {
  children: ReactNode
  store?: ProgressStore
}) {
  const [progress, setProgress] = useState<ProgressState>(() => store.load())

  useEffect(() => {
    soundEngine.setMuted(progress.soundMuted)
  }, [progress.soundMuted])

  const persist = useCallback(
    (next: ProgressState) => {
      setProgress(next)
      store.save(next)
    },
    [store],
  )

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
      },
    ) => {
      const { next, result } = applySessionToProgress(progress, partial)

      const answered = partial.answers.length > 0
      const skipCrate = partial.mode === 'learn' || !answered

      if (skipCrate) {
        persist(next)
        return result
      }

      const activity: CrateActivityKey =
        partial.crateActivity ??
        (partial.mode === 'challenge'
          ? 'challenge'
          : partial.mode === 'match'
            ? 'match'
            : partial.mode === 'misses'
              ? 'misses'
              : 'train')

      const newlyMastered = detectNewlyMastered(progress, next, partial.tables)
      const roll = rollCrateForCompletion({
        completionId: partial.sessionId,
        activity,
        crates: next.crates,
        newlyMasteredTable: newlyMastered,
        isMissionOfDay: partial.isMissionOfDay,
      })

      persist({ ...next, crates: roll.crates })
      return result
    },
    [persist, progress],
  )

  const resetProgress = useCallback(() => {
    store.clear()
    const fresh = createInitialProgress()
    fresh.soundMuted = progress.soundMuted
    persist(fresh)
  }, [persist, progress.soundMuted, store])

  const setSoundMuted = useCallback(
    (muted: boolean) => {
      persist({ ...progress, soundMuted: muted })
      soundEngine.setMuted(muted)
    },
    [persist, progress],
  )

  const updateReward = useCallback(
    (reward: RewardProgress) => {
      persist({ ...progress, reward })
    },
    [persist, progress],
  )

  const updateCrates = useCallback(
    (crates: CratesState) => {
      persist({ ...progress, crates })
    },
    [persist, progress],
  )

  const updateSchool = useCallback(
    (school: SchoolProfile) => {
      persist({ ...progress, school })
    },
    [persist, progress],
  )

  const setActivityAssignments = useCallback(
    (activityAssignments: ActivityAssignmentMap) => {
      persist({ ...progress, activityAssignments })
    },
    [persist, progress],
  )

  const chooseCrate = useCallback(
    (index: number) => {
      persist({ ...progress, crates: chooseCrateOption(progress.crates, index) })
    },
    [persist, progress],
  )

  const openCrate = useCallback(() => {
    persist({ ...progress, crates: markCrateOpened(progress.crates) })
  }, [persist, progress])

  const collectCrate = useCallback(() => {
    const collected = collectPendingCrate(progress.crates)
    if (!collected.applied || !collected.reward) {
      if (collected.crates !== progress.crates) persist({ ...progress, crates: collected.crates })
      return null
    }
    const applied = applyCrateRewardToProgress(
      { ...progress, crates: collected.crates },
      collected.reward,
    )
    persist(applied.next)
    return applied.adjustmentNote
  }, [persist, progress])

  const claimAchievement = useCallback(
    (achievementId: string) => {
      const achievement = achievementCatalog.find((item) => item.id === achievementId)
      if (!achievement || !achievementIsUnlocked(achievement, progress)) return false
      if (progress.achievements.claimedIds.includes(achievementId)) return false

      persist({
        ...progress,
        xp: progress.xp + (achievement.reward.xp ?? 0),
        coins: progress.coins + (achievement.reward.coins ?? 0),
        achievements: {
          claimedIds: [...progress.achievements.claimedIds, achievementId],
        },
      })
      return true
    },
    [persist, progress],
  )

  const value = useMemo(
    () => ({
      progress,
      applySession,
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
      applySession,
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

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress debe usarse dentro de ProgressProvider')
  return ctx
}
