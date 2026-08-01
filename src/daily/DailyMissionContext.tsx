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
import { useAuth } from '@/auth/AuthContext'
import { DAILY_TASKS, type DailySkillKey, type DailyTaskDef } from '@/daily/dailyTasks'
import {
  advanceMissionProgress,
  hasMissionStatBeenCounted,
  isDailyMissionComplete,
  loadDailyMissionSnapshot,
  markChallengeDone,
  markMissionStatCounted,
  saveDailyMissionSnapshot,
  type DailyMissionSnapshot,
} from '@/daily/missionEnergy'
import { useProgress } from '@/progress/ProgressContext'
import { newId } from '@/progress/repository'
import { localDateString } from '@/reward/engine'
import { enqueueAndSyncDailyMission } from '@/sync/dailyMissionSync'

export type { DailySkillKey, DailyTaskDef }
export { DAILY_TASKS }

function sameDailySnapshot(a: DailyMissionSnapshot, b: DailyMissionSnapshot): boolean {
  if (a.date !== b.date || a.challengeDone !== b.challengeDone) return false
  return DAILY_TASKS.every((t) => (a.progress[t.key] ?? 0) === (b.progress[t.key] ?? 0))
}

interface DailyMissionContextValue {
  date: string
  progress: Record<DailySkillKey, number>
  tasks: DailyTaskDef[]
  completedCount: number
  allDone: boolean
  challengeDone: boolean
  recordProgress: (key: DailySkillKey, amount?: number) => void
  markChallengeComplete: () => void
}

const DailyMissionContext = createContext<DailyMissionContextValue | null>(null)

export function DailyMissionProvider({ children }: { children: ReactNode }) {
  const { player } = useAuth()
  const { grantActivityEnergy } = useProgress()
  const playerId = player?.id ?? null
  const playerSlug = player?.slug ?? null
  const skipSaveRef = useRef(false)
  const [state, setState] = useState<DailyMissionSnapshot>(() =>
    loadDailyMissionSnapshot(playerId),
  )

  const pushServer = useCallback(
    (snapshot: DailyMissionSnapshot) => {
      if (playerId == null) return
      void enqueueAndSyncDailyMission({
        playerId,
        playerSlug,
        snapshot,
      }).then((result) => {
        setState((prev) =>
          sameDailySnapshot(prev, result.snapshot) ? prev : result.snapshot,
        )
      })
    },
    [playerId, playerSlug],
  )

  /** Una vez al día: +1 a dailyMissionsCompleted para logros (local + sync). */
  const creditMissionCompletionStat = useCallback(
    (snapshot: DailyMissionSnapshot) => {
      if (!isDailyMissionComplete(snapshot)) return
      const today = snapshot.date || localDateString()
      if (hasMissionStatBeenCounted(playerId, today)) return
      markMissionStatCounted(playerId, today)
      grantActivityEnergy({
        sessionId: newId('daily-mission-done'),
        requestedPoints: 0,
        mode: 'daily-done',
        correct: 1,
        wrong: 0,
        statsDelta: { dailyMissionsCompleted: 1 },
      })
    },
    [grantActivityEnergy, playerId],
  )

  // Al cambiar de niño: cargar su snapshot. No guardar el estado viejo encima.
  useEffect(() => {
    skipSaveRef.current = true
    setState(loadDailyMissionSnapshot(playerId))
  }, [playerId])

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false
      return
    }
    saveDailyMissionSnapshot(state, playerId, { notify: false })
  }, [state, playerId])

  useEffect(() => {
    const refresh = () => {
      setState((prev) => {
        const next = loadDailyMissionSnapshot(playerId)
        return sameDailySnapshot(prev, next) ? prev : next
      })
    }
    window.addEventListener('aray-daily-mission-changed', refresh)
    return () => window.removeEventListener('aray-daily-mission-changed', refresh)
  }, [playerId])

  // Si ya estaba 5/5 (p. ej. hoy antes del fix), acredita el logro una vez.
  useEffect(() => {
    creditMissionCompletionStat(state)
  }, [state, creditMissionCompletionStat])

  const recordProgress = useCallback(
    (key: DailySkillKey, amount = 1) => {
      const add = Math.max(0, Math.floor(amount))
      if (add <= 0) return
      const next = advanceMissionProgress(playerId, key, add, localDateString())
      setState(next)
      pushServer(next)
      creditMissionCompletionStat(next)
    },
    [creditMissionCompletionStat, playerId, pushServer],
  )

  const markChallengeComplete = useCallback(() => {
    markChallengeDone(playerId, localDateString())
    const next = loadDailyMissionSnapshot(playerId)
    setState(next)
    pushServer(next)
  }, [playerId, pushServer])

  const completedCount = DAILY_TASKS.filter((t) => (state.progress[t.key] ?? 0) >= t.target).length
  const allDone = completedCount >= DAILY_TASKS.length

  const value = useMemo(
    () => ({
      date: state.date,
      progress: state.progress,
      tasks: DAILY_TASKS,
      completedCount,
      allDone,
      challengeDone: state.challengeDone,
      recordProgress,
      markChallengeComplete,
    }),
    [state, completedCount, allDone, recordProgress, markChallengeComplete],
  )

  return (
    <DailyMissionContext.Provider value={value}>{children}</DailyMissionContext.Provider>
  )
}

export function useDailyMission() {
  const ctx = useContext(DailyMissionContext)
  if (!ctx) throw new Error('useDailyMission fuera de DailyMissionProvider')
  return ctx
}
