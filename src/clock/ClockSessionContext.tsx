import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ClockLang, ClockSessionSummary } from '@/clock/types'

const LANG_KEY = 'aray.clock.lang'

function readLang(): ClockLang {
  try {
    const v = sessionStorage.getItem(LANG_KEY)
    if (v === 'ca' || v === 'es') return v
  } catch {
    /* ignore */
  }
  return 'es'
}

interface ClockSessionContextValue {
  lang: ClockLang
  setLang: (lang: ClockLang) => void
  lastSummary: ClockSessionSummary | null
  setLastSummary: (summary: ClockSessionSummary | null) => void
}

const ClockSessionContext = createContext<ClockSessionContextValue | null>(null)

export function ClockSessionProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<ClockLang>(() => readLang())
  const [lastSummary, setLastSummary] = useState<ClockSessionSummary | null>(null)

  const setLang = useCallback((next: ClockLang) => {
    setLangState(next)
    try {
      sessionStorage.setItem(LANG_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({ lang, setLang, lastSummary, setLastSummary }),
    [lang, setLang, lastSummary],
  )

  return <ClockSessionContext.Provider value={value}>{children}</ClockSessionContext.Provider>
}

export function useClockSession(): ClockSessionContextValue {
  const ctx = useContext(ClockSessionContext)
  if (!ctx) {
    throw new Error('useClockSession debe usarse dentro de ClockSessionProvider')
  }
  return ctx
}
