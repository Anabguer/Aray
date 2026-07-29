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

export interface TablesSelection {
  tables: number[]
  mix: boolean
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

export function PlayProvider({ children }: { children: ReactNode }) {
  const [selection, setSelectionState] = useState<TablesSelection>(() =>
    typeof sessionStorage !== 'undefined' ? loadSelection() : { tables: [7], mix: false },
  )
  const [pendingQueue, setPendingQueue] = useState<QuestionCard[] | null>(null)
  const [lastResult, setLastResult] = useState<SessionResult | null>(null)
  const [activeMode, setActiveMode] = useState<PlayMode | null>(null)

  const setSelection = useCallback((next: TablesSelection) => {
    setSelectionState(next)
    try {
      sessionStorage.setItem(TABLES_SELECTION_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }, [])

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
    }),
    [selection, setSelection, pendingQueue, lastResult, activeMode],
  )

  return <PlayContext.Provider value={value}>{children}</PlayContext.Provider>
}

export function usePlaySession() {
  const ctx = useContext(PlayContext)
  if (!ctx) throw new Error('usePlaySession debe usarse dentro de PlayProvider')
  return ctx
}
