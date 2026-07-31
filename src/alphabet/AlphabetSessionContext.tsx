import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AlphabetPlayMode, AlphabetSessionSummary } from '@/alphabet/types'

interface AlphabetSessionContextValue {
  lastSummary: AlphabetSessionSummary | null
  setLastSummary: (summary: AlphabetSessionSummary | null) => void
  lastMode: AlphabetPlayMode | null
  setLastMode: (mode: AlphabetPlayMode | null) => void
}

const AlphabetSessionContext = createContext<AlphabetSessionContextValue | null>(null)

export function AlphabetSessionProvider({ children }: { children: ReactNode }) {
  const [lastSummary, setLastSummary] = useState<AlphabetSessionSummary | null>(null)
  const [lastMode, setLastMode] = useState<AlphabetPlayMode | null>(null)

  const value = useMemo(
    () => ({ lastSummary, setLastSummary, lastMode, setLastMode }),
    [lastSummary, lastMode],
  )

  return (
    <AlphabetSessionContext.Provider value={value}>{children}</AlphabetSessionContext.Provider>
  )
}

export function useAlphabetSession(): AlphabetSessionContextValue {
  const ctx = useContext(AlphabetSessionContext)
  if (!ctx) {
    throw new Error('useAlphabetSession debe usarse dentro de AlphabetSessionProvider')
  }
  return ctx
}
