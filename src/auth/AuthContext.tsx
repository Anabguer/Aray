import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiGet, apiPost, peekCsrf, setCsrf } from '@/api/client'

export type AuthRole = 'adult' | null

export type AuthAccount = {
  id: number
  login: string | null
  displayName: string | null
}

export type AuthPlayer = {
  id: number
  slug: string | null
  displayName: string | null
}

export type AuthSessionSeed = {
  role: AuthRole
  account: AuthAccount | null
  players?: AuthPlayer[]
  csrf: string
}

type MeResponse = {
  authenticated?: boolean
  role?: AuthRole | 'child' | null
  account?: AuthAccount
  players?: AuthPlayer[]
  csrf?: string
}

type AuthContextValue = {
  loading: boolean
  role: AuthRole
  account: AuthAccount | null
  players: AuthPlayer[]
  csrf: string | null
  refreshMe: () => Promise<void>
  loginAdultPin: (pin: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  children,
  initialSession,
}: {
  children: ReactNode
  /** Si se pasa, no se llama a la API al montar (útil en tests). */
  initialSession?: AuthSessionSeed
}) {
  const [loading, setLoading] = useState(!initialSession)
  const [role, setRole] = useState<AuthRole>(initialSession?.role ?? null)
  const [account, setAccount] = useState<AuthAccount | null>(initialSession?.account ?? null)
  const [players, setPlayers] = useState<AuthPlayer[]>(initialSession?.players ?? [])
  const [csrf, setCsrfState] = useState<string | null>(() => {
    if (initialSession?.csrf) {
      setCsrf(initialSession.csrf)
      return initialSession.csrf
    }
    return null
  })

  useEffect(() => {
    if (initialSession?.csrf) setCsrf(initialSession.csrf)
  }, [initialSession])

  const syncCsrfState = useCallback(() => {
    setCsrfState(peekCsrf())
  }, [])

  const refreshMe = useCallback(async () => {
    const data = await apiGet<MeResponse>('/auth/me.php')
    const nextRole = data.role === 'adult' ? 'adult' : null
    setRole(nextRole)
    setAccount(nextRole === 'adult' ? (data.account ?? null) : null)
    setPlayers(nextRole === 'adult' && Array.isArray(data.players) ? data.players : [])
    if (typeof data.csrf === 'string') setCsrf(data.csrf)
    syncCsrfState()
  }, [syncCsrfState])

  useEffect(() => {
    if (initialSession) return
    let cancelled = false
    ;(async () => {
      try {
        await refreshMe()
      } catch {
        if (!cancelled) {
          setRole(null)
          setAccount(null)
          setPlayers([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [initialSession, refreshMe])

  const loginAdultPin = useCallback(
    async (pin: string) => {
      const data = await apiPost<MeResponse>('/auth/pin-login.php', { pin })
      if (data.role !== 'adult') {
        throw new Error('PIN incorrecto')
      }
      setRole('adult')
      setAccount(data.account ?? null)
      setPlayers(Array.isArray(data.players) ? data.players : [])
      if (typeof data.csrf === 'string') setCsrf(data.csrf)
      syncCsrfState()
    },
    [syncCsrfState],
  )

  const logout = useCallback(async () => {
    try {
      await apiPost('/auth/adult-logout.php', {})
    } catch {
      /* sesión ya inválida */
    }
    setRole(null)
    setAccount(null)
    setPlayers([])
    syncCsrfState()
  }, [syncCsrfState])

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      role,
      account,
      players,
      csrf,
      refreshMe,
      loginAdultPin,
      logout,
    }),
    [loading, role, account, players, csrf, refreshMe, loginAdultPin, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
