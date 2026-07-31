import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { SpellPlayMode, SpellSessionSummary } from '@/spelling/types'

interface SpellSessionContextValue {
  lastSummary: SpellSessionSummary | null
  setLastSummary: (s: SpellSessionSummary | null) => void
  lastMode: SpellPlayMode | null
  setLastMode: (m: SpellPlayMode | null) => void
}

const Ctx = createContext<SpellSessionContextValue | null>(null)

export function SpellSessionProvider({ children }: { children: ReactNode }) {
  const [lastSummary, setLastSummaryState] = useState<SpellSessionSummary | null>(null)
  const [lastMode, setLastMode] = useState<SpellPlayMode | null>(null)
  const setLastSummary = useCallback((s: SpellSessionSummary | null) => setLastSummaryState(s), [])
  const value = useMemo(
    () => ({ lastSummary, setLastSummary, lastMode, setLastMode }),
    [lastSummary, setLastSummary, lastMode],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSpellSession() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSpellSession fuera de SpellSessionProvider')
  return ctx
}
