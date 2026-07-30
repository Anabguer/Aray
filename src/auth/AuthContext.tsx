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
import { authorizeCurrentDevice } from '@/sync/playSession'

export type AuthRole = 'adult' | 'child' | null

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
  player?: AuthPlayer | null
  players?: AuthPlayer[]
  csrf: string
}

type MeResponse = {
  authenticated?: boolean
  role?: AuthRole | null
  account?: AuthAccount
  players?: AuthPlayer[]
  player?: AuthPlayer
  device?: { authorized?: boolean; player?: AuthPlayer }
  csrf?: string
}

type AuthContextValue = {
  loading: boolean
  role: AuthRole
  account: AuthAccount | null
  player: AuthPlayer | null
  players: AuthPlayer[]
  deviceAuthorized: boolean
  csrf: string | null
  refreshMe: () => Promise<void>
  loginAdultPin: (pin: string) => Promise<void>
  authorizeDeviceForPlayer: (playerId: number, label?: string) => Promise<void>
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
  const [player, setPlayer] = useState<AuthPlayer | null>(initialSession?.player ?? null)
  const [players, setPlayers] = useState<AuthPlayer[]>(initialSession?.players ?? [])
  const [deviceAuthorized, setDeviceAuthorized] = useState(false)
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

  const applyMe = useCallback(
    (data: MeResponse) => {
      const nextRole = data.role === 'adult' || data.role === 'child' ? data.role : null
      setRole(nextRole)
      setAccount(nextRole === 'adult' ? (data.account ?? null) : null)
      setPlayer(nextRole === 'child' ? (data.player ?? null) : null)
      setPlayers(nextRole === 'adult' && Array.isArray(data.players) ? data.players : [])
      setDeviceAuthorized(Boolean(data.device?.authorized))
      if (typeof data.csrf === 'string') setCsrf(data.csrf)
      syncCsrfState()
    },
    [syncCsrfState],
  )

  const refreshMe = useCallback(async () => {
    const data = await apiGet<MeResponse>('/auth/me.php')
    applyMe(data)
  }, [applyMe])

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
          setPlayer(null)
          setPlayers([])
          setDeviceAuthorized(false)
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
      applyMe(data)
    },
    [applyMe],
  )

  const authorizeDeviceForPlayer = useCallback(
    async (playerId: number, label = 'Dispositivo de Aray') => {
      await authorizeCurrentDevice(playerId, label)
      await refreshMe()
    },
    [refreshMe],
  )

  const logout = useCallback(async () => {
    try {
      await apiPost('/auth/adult-logout.php', {})
    } catch {
      /* sesión ya inválida */
    }
    setRole(null)
    setAccount(null)
    setPlayer(null)
    setPlayers([])
    syncCsrfState()
  }, [syncCsrfState])

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      role,
      account,
      player,
      players,
      deviceAuthorized,
      csrf,
      refreshMe,
      loginAdultPin,
      authorizeDeviceForPlayer,
      logout,
    }),
    [
      loading,
      role,
      account,
      player,
      players,
      deviceAuthorized,
      csrf,
      refreshMe,
      loginAdultPin,
      authorizeDeviceForPlayer,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
