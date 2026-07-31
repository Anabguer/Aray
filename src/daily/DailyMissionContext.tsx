import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { sideActivityEnergy } from '@/config/rewardGoal'
import { useProgress } from '@/progress/ProgressContext'
import { localDateString } from '@/reward/engine'

export type DailySkillKey = 'tables' | 'calc' | 'spelling' | 'clocks' | 'money'

export interface DailyTaskDef {
  key: DailySkillKey
  label: string
  target: number
  href: string
}

export const DAILY_TASKS: DailyTaskDef[] = [
  { key: 'tables', label: 'Tablas', target: 6, href: '/missions/mates/tables' },
  { key: 'calc', label: 'Cálculo', target: 5, href: '/missions/mates/calc/mix' },
  { key: 'spelling', label: 'Ortografía', target: 4, href: '/missions/languages/spelling/mix' },
  { key: 'clocks', label: 'Relojes', target: 2, href: '/missions/mates/clocks/train' },
  { key: 'money', label: 'Dinero', target: 1, href: '/missions/mates/money/change' },
]

interface DailyState {
  date: string
  progress: Record<DailySkillKey, number>
  bonusClaimed: boolean
}

const STORAGE_KEY = 'aray.dailyMission.v1'

function emptyProgress(): Record<DailySkillKey, number> {
  return { tables: 0, calc: 0, spelling: 0, clocks: 0, money: 0 }
}

function loadState(today: string): DailyState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { date: today, progress: emptyProgress(), bonusClaimed: false }
    const parsed = JSON.parse(raw) as DailyState
    if (parsed.date !== today) {
      return { date: today, progress: emptyProgress(), bonusClaimed: false }
    }
    return {
      date: today,
      progress: { ...emptyProgress(), ...parsed.progress },
      bonusClaimed: Boolean(parsed.bonusClaimed),
    }
  } catch {
    return { date: today, progress: emptyProgress(), bonusClaimed: false }
  }
}

function saveState(state: DailyState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

interface DailyMissionContextValue {
  date: string
  progress: Record<DailySkillKey, number>
  tasks: DailyTaskDef[]
  completedCount: number
  allDone: boolean
  bonusClaimed: boolean
  recordProgress: (key: DailySkillKey, amount?: number) => void
  claimBonusIfReady: () => boolean
}

const DailyMissionContext = createContext<DailyMissionContextValue | null>(null)

export function DailyMissionProvider({ children }: { children: ReactNode }) {
  const { grantActivityEnergy } = useProgress()
  const [state, setState] = useState<DailyState>(() => loadState(localDateString()))

  useEffect(() => {
    setState(loadState(localDateString()))
  }, [])

  useEffect(() => {
    saveState(state)
  }, [state])

  const recordProgress = useCallback((key: DailySkillKey, amount = 1) => {
    const add = Math.max(0, Math.floor(amount))
    if (add <= 0) return
    setState((prev) => {
      const date = localDateString()
      const base =
        prev.date === date ? prev : { date, progress: emptyProgress(), bonusClaimed: false }
      const task = DAILY_TASKS.find((t) => t.key === key)
      const cap = task?.target ?? 99
      const current = base.progress[key] ?? 0
      if (current >= cap) return base
      return {
        ...base,
        progress: {
          ...base.progress,
          [key]: Math.min(cap, current + add),
        },
      }
    })
  }, [])

  const completedCount = DAILY_TASKS.filter((t) => (state.progress[t.key] ?? 0) >= t.target).length
  const allDone = completedCount >= DAILY_TASKS.length

  const claimBonusIfReady = useCallback(() => {
    if (!allDone || state.bonusClaimed) return false
    grantActivityEnergy({
      sessionId: `daily-bonus-${state.date}`,
      requestedPoints: sideActivityEnergy.dailyBonus,
      mode: 'daily_bonus',
      correct: DAILY_TASKS.length,
      wrong: 0,
    })
    setState((prev) => ({ ...prev, bonusClaimed: true }))
    return true
  }, [allDone, state.bonusClaimed, state.date, grantActivityEnergy])

  const value = useMemo(
    () => ({
      date: state.date,
      progress: state.progress,
      tasks: DAILY_TASKS,
      completedCount,
      allDone,
      bonusClaimed: state.bonusClaimed,
      recordProgress,
      claimBonusIfReady,
    }),
    [state, completedCount, allDone, recordProgress, claimBonusIfReady],
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
