import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { EnglishPlayMode, EnglishSessionSummary } from '@/english/types'

type EnglishSessionApi = {
  lastSummary: EnglishSessionSummary | null
  setLastSummary: (s: EnglishSessionSummary | null) => void
  lastMode: EnglishPlayMode | null
  setLastMode: (m: EnglishPlayMode | null) => void
  lastPackId: string | null
  setLastPackId: (id: string | null) => void
}

const EnglishSessionContext = createContext<EnglishSessionApi | null>(null)

export function EnglishSessionProvider({ children }: { children: ReactNode }) {
  const [lastSummary, setLastSummary] = useState<EnglishSessionSummary | null>(
    null,
  )
  const [lastMode, setLastMode] = useState<EnglishPlayMode | null>(null)
  const [lastPackId, setLastPackId] = useState<string | null>(null)
  const value = useMemo(
    () => ({
      lastSummary,
      setLastSummary,
      lastMode,
      setLastMode,
      lastPackId,
      setLastPackId,
    }),
    [lastSummary, lastMode, lastPackId],
  )
  return (
    <EnglishSessionContext.Provider value={value}>
      {children}
    </EnglishSessionContext.Provider>
  )
}

export function useEnglishSession(): EnglishSessionApi {
  const ctx = useContext(EnglishSessionContext)
  if (!ctx) {
    throw new Error('useEnglishSession fuera de EnglishSessionProvider')
  }
  return ctx
}
