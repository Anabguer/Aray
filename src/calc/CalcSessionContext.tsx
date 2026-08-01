import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CalcPlayModeOrMisses, CalcSessionSummary } from '@/calc/types'

interface CalcSessionContextValue {
  lastSummary: CalcSessionSummary | null
  setLastSummary: (summary: CalcSessionSummary | null) => void
  lastMode: CalcPlayModeOrMisses | null
  setLastMode: (mode: CalcPlayModeOrMisses | null) => void
}

const CalcSessionContext = createContext<CalcSessionContextValue | null>(null)

export function CalcSessionProvider({ children }: { children: ReactNode }) {
  const [lastSummary, setLastSummaryState] = useState<CalcSessionSummary | null>(null)
  const [lastMode, setLastMode] = useState<CalcPlayModeOrMisses | null>(null)

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
