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

export type AuthRole = 'child' | 'adult' | null

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
  player: AuthPlayer | null
  deviceAuthorized: boolean
  csrf: string
  players?: AuthPlayer[]
}

type MeResponse = {
  authenticated?: boolean
  role?: AuthRole
  account?: AuthAccount
  player?: AuthPlayer
  players?: AuthPlayer[]
  csrf?: string
  device?: {
    authorized?: boolean
    deviceId?: number
    deviceLabel?: string
    player?: AuthPlayer
  }
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
  loginPin: (pin: string) => Promise<void>
  adultLogin: (login: string, password: string) => Promise<AuthPlayer[]>
  logout: () => Promise<void>
  authorizeDevice: (playerId: number, deviceLabel?: string) => Promise<void>
  redeemTempCode: (code: string, playerSlug?: string, deviceLabel?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function applyMe(data: MeResponse, setters: {
  setRole: (r: AuthRole) => void
  setAccount: (a: AuthAccount | null) => void
  setPlayer: (p: AuthPlayer | null) => void
  setPlayers: (p: AuthPlayer[]) => void
  setDeviceAuthorized: (v: boolean) => void
}) {
  const role = data.role ?? null
  setters.setRole(role)
  setters.setAccount(data.account ?? null)
  setters.setPlayer(data.player ?? null)
  setters.setPlayers(Array.isArray(data.players) ? data.players : [])
  setters.setDeviceAuthorized(Boolean(data.device?.authorized))
  if (typeof data.csrf === 'string') setCsrf(data.csrf)
}

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
  const [deviceAuthorized, setDeviceAuthorized] = useState(
    initialSession?.deviceAuthorized ?? false,
  )
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
    applyMe(data, { setRole, setAccount, setPlayer, setPlayers, setDeviceAuthorized })
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

  const loginPin = useCallback(
    async (pin: string) => {
      const data = await apiPost<MeResponse>('/auth/pin-login.php', { pin })
      applyMe(
        {
          ...data,
          device: { authorized: true },
          authenticated: true,
        },
        { setRole, setAccount, setPlayer, setPlayers, setDeviceAuthorized },
      )
      if (data.role === 'child' && data.player) {
        setPlayer(data.player)
        setAccount(null)
      }
      if (data.role === 'adult' && data.account) {
        setAccount(data.account)
        setPlayer(null)
      }
      setDeviceAuthorized(true)
      syncCsrfState()
    },
    [syncCsrfState],
  )

  const adultLogin = useCallback(
    async (login: string, password: string) => {
      const data = await apiPost<MeResponse & { players?: AuthPlayer[] }>('/auth/adult-login.php', {
        login,
        password,
      })
      const list = Array.isArray(data.players) ? data.players : []
      setRole('adult')
      setAccount(data.account ?? null)
      setPlayer(null)
      setPlayers(list)
      syncCsrfState()
      return list
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
    setPlayer(null)
    setPlayers([])
    syncCsrfState()
    try {
      await refreshMe()
    } catch {
      /* ignore */
    }
  }, [refreshMe, syncCsrfState])

  const authorizeDevice = useCallback(
    async (playerId: number, deviceLabel = 'Este dispositivo') => {
      const data = await apiPost<{
        player?: AuthPlayer
        csrf?: string
      }>('/auth/device-authorize.php', { playerId, deviceLabel })
      setDeviceAuthorized(true)
      setRole('child')
      setPlayer(data.player ?? null)
      setAccount(null)
      syncCsrfState()
    },
    [syncCsrfState],
  )

  const redeemTempCode = useCallback(
    async (code: string, playerSlug = 'aray', deviceLabel = 'Este dispositivo') => {
      const data = await apiPost<{ player?: AuthPlayer }>('/auth/temp-code-redeem.php', {
        code,
        playerSlug,
        deviceLabel,
      })
      setDeviceAuthorized(true)
      setRole('child')
      setPlayer(data.player ?? null)
      setAccount(null)
      syncCsrfState()
    },
    [syncCsrfState],
  )

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
      loginPin,
      adultLogin,
      logout,
      authorizeDevice,
      redeemTempCode,
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
      loginPin,
      adultLogin,
      logout,
      authorizeDevice,
      redeemTempCode,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
