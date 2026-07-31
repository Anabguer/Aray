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
  loadDailyMissionSnapshot,
  markChallengeDone,
  saveDailyMissionSnapshot,
  type DailyMissionSnapshot,
} from '@/daily/missionEnergy'
import { localDateString } from '@/reward/engine'

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
  const playerId = player?.id ?? null
  const skipSaveRef = useRef(false)
  const [state, setState] = useState<DailyMissionSnapshot>(() =>
    loadDailyMissionSnapshot(playerId),
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

  const recordProgress = useCallback(
    (key: DailySkillKey, amount = 1) => {
      const add = Math.max(0, Math.floor(amount))
      if (add <= 0) return
      // Escritura atómica en storage (misma vía que tablas) + UI al día.
      const next = advanceMissionProgress(playerId, key, add, localDateString())
      setState(next)
    },
    [playerId],
  )

  const markChallengeComplete = useCallback(() => {
    markChallengeDone(playerId, localDateString())
    setState(loadDailyMissionSnapshot(playerId))
  }, [playerId])

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
