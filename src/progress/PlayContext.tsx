import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { PlayMode, QuestionCard, SessionResult } from '@/math/types'

const TABLES_SELECTION_KEY = 'aray.tables.selection'
const MISSION_OF_DAY_KEY = 'aray.missionOfDay'

export interface TablesSelection {
  tables: number[]
  mix: boolean
}

export interface MissionOfDayState {
  code: string
}

interface PlayContextValue {
  selection: TablesSelection
  setSelection: (selection: TablesSelection) => void
  pendingQueue: QuestionCard[] | null
  setPendingQueue: (queue: QuestionCard[] | null) => void
  lastResult: SessionResult | null
  setLastResult: (result: SessionResult | null) => void
  activeMode: PlayMode | null
  setActiveMode: (mode: PlayMode | null) => void
  missionOfDay: MissionOfDayState | null
  setMissionOfDay: (mission: MissionOfDayState | null) => void
  consumeMissionOfDay: () => MissionOfDayState | null
}

const PlayContext = createContext<PlayContextValue | null>(null)

function loadSelection(): TablesSelection {
  try {
    const raw = sessionStorage.getItem(TABLES_SELECTION_KEY)
    if (!raw) return { tables: [7], mix: false }
    const parsed = JSON.parse(raw) as TablesSelection
    if (!parsed.tables?.length) return { tables: [7], mix: false }
    return parsed
  } catch {
    return { tables: [7], mix: false }
  }
}

function loadMissionOfDay(): MissionOfDayState | null {
  try {
    const raw = sessionStorage.getItem(MISSION_OF_DAY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as MissionOfDayState
    if (!parsed?.code || typeof parsed.code !== 'string') return null
    return { code: parsed.code }
  } catch {
    return null
  }
}

export function PlayProvider({ children }: { children: ReactNode }) {
  const [selection, setSelectionState] = useState<TablesSelection>(() =>
    typeof sessionStorage !== 'undefined' ? loadSelection() : { tables: [7], mix: false },
  )
  const [pendingQueue, setPendingQueue] = useState<QuestionCard[] | null>(null)
  const [lastResult, setLastResult] = useState<SessionResult | null>(null)
  const [activeMode, setActiveMode] = useState<PlayMode | null>(null)
  const [missionOfDay, setMissionOfDayState] = useState<MissionOfDayState | null>(() =>
    typeof sessionStorage !== 'undefined' ? loadMissionOfDay() : null,
  )

  const setSelection = useCallback((next: TablesSelection) => {
    setSelectionState(next)
    try {
      sessionStorage.setItem(TABLES_SELECTION_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }, [])

  const setMissionOfDay = useCallback((mission: MissionOfDayState | null) => {
    setMissionOfDayState(mission)
    try {
      if (mission) sessionStorage.setItem(MISSION_OF_DAY_KEY, JSON.stringify(mission))
      else sessionStorage.removeItem(MISSION_OF_DAY_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const consumeMissionOfDay = useCallback(() => {
    const current = loadMissionOfDay()
    setMissionOfDay(null)
    return current
  }, [setMissionOfDay])

  const value = useMemo(
    () => ({
      selection,
      setSelection,
      pendingQueue,
      setPendingQueue,
      lastResult,
      setLastResult,
      activeMode,
      setActiveMode,
      missionOfDay,
      setMissionOfDay,
      consumeMissionOfDay,
    }),
    [
      selection,
      setSelection,
      pendingQueue,
      lastResult,
      activeMode,
      missionOfDay,
      setMissionOfDay,
      consumeMissionOfDay,
    ],
  )

  return <PlayContext.Provider value={value}>{children}</PlayContext.Provider>
}

export function usePlaySession() {
  const ctx = useContext(PlayContext)
  if (!ctx) throw new Error('usePlaySession debe usarse dentro de PlayProvider')
  return ctx
}
