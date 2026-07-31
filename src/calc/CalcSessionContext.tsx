import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CalcPlayMode, CalcSessionSummary } from '@/calc/types'

interface CalcSessionContextValue {
  lastSummary: CalcSessionSummary | null
  setLastSummary: (summary: CalcSessionSummary | null) => void
  lastMode: CalcPlayMode | null
  setLastMode: (mode: CalcPlayMode | null) => void
}

const CalcSessionContext = createContext<CalcSessionContextValue | null>(null)

export function CalcSessionProvider({ children }: { children: ReactNode }) {
  const [lastSummary, setLastSummaryState] = useState<CalcSessionSummary | null>(null)
  const [lastMode, setLastMode] = useState<CalcPlayMode | null>(null)

  const setLastSummary = useCallback((summary: CalcSessionSummary | null) => {
    setLastSummaryState(summary)
  }, [])

  const value = useMemo(
    () => ({ lastSummary, setLastSummary, lastMode, setLastMode }),
    [lastSummary, setLastSummary, lastMode],
  )

  return <CalcSessionContext.Provider value={value}>{children}</CalcSessionContext.Provider>
}

export function useCalcSession(): CalcSessionContextValue {
  const ctx = useContext(CalcSessionContext)
  if (!ctx) throw new Error('useCalcSession debe usarse dentro de CalcSessionProvider')
  return ctx
}
