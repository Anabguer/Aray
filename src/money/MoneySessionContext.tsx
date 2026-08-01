import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { MoneyPlayModeOrMisses, MoneySessionSummary } from '@/money/types'

interface Value {
  lastSummary: MoneySessionSummary | null
  setLastSummary: (s: MoneySessionSummary | null) => void
  lastMode: MoneyPlayModeOrMisses | null
  setLastMode: (m: MoneyPlayModeOrMisses | null) => void
}

const Ctx = createContext<Value | null>(null)

export function MoneySessionProvider({ children }: { children: ReactNode }) {
  const [lastSummary, setLastSummaryState] = useState<MoneySessionSummary | null>(null)
  const [lastMode, setLastMode] = useState<MoneyPlayModeOrMisses | null>(null)
  const setLastSummary = useCallback((s: MoneySessionSummary | null) => setLastSummaryState(s), [])
  const value = useMemo(
    () => ({ lastSummary, setLastSummary, lastMode, setLastMode }),
    [lastSummary, setLastSummary, lastMode],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useMoneySession() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useMoneySession fuera de MoneySessionProvider')
  return ctx
}
