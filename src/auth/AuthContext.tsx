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
import { startPlayHeartbeat, stopPlayHeartbeat } from '@/sync/playHeartbeat'

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
  avatarUrl?: string | null
  courseId?: string | null
}

export type AuthSessionSeed = {
  role: AuthRole
  account: AuthAccount | null
  player?: AuthPlayer | null
  players?: AuthPlayer[]
  csrf: string
  deviceAuthorized?: boolean
  tutorDisplayName?: string | null
}

type MeResponse = {
  authenticated?: boolean
  role?: AuthRole | null
  account?: AuthAccount
  players?: AuthPlayer[]
  player?: AuthPlayer
  device?: {
    authorized?: boolean
    accountId?: number
    accountDisplayName?: string | null
    player?: AuthPlayer
    players?: AuthPlayer[]
  }
  csrf?: string
}

export type RegisterChildInput = {
  displayName: string
  courseId: string
}

type AuthContextValue = {
  loading: boolean
  role: AuthRole
  account: AuthAccount | null
  player: AuthPlayer | null
  players: AuthPlayer[]
  /** Jugadores de la familia en este dispositivo (también sin sesión adulta). */
  familyPlayers: AuthPlayer[]
  deviceAuthorized: boolean
  tutorDisplayName: string | null
  csrf: string | null
  refreshMe: () => Promise<void>
  loginAdult: (login: string, password: string) => Promise<AuthPlayer[]>
  registerFamily: (input: {
    login: string
    password: string
    displayName: string
    pin: string
    children: RegisterChildInput[]
  }) => Promise<AuthPlayer[]>
  loginAdultPin: (pin: string) => Promise<void>
  enterAsChild: (playerSlug: string) => Promise<void>
  authorizeDeviceForPlayer: (playerId: number, label?: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function asPlayers(list: unknown): AuthPlayer[] {
  if (!Array.isArray(list)) return []
  return list.filter(
    (p): p is AuthPlayer =>
      typeof p === 'object' &&
      p !== null &&
      typeof (p as AuthPlayer).id === 'number',
  )
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
  const [familyPlayers, setFamilyPlayers] = useState<AuthPlayer[]>(
    initialSession?.players ?? [],
  )
  const [deviceAuthorized, setDeviceAuthorized] = useState(
    Boolean(initialSession?.deviceAuthorized),
  )
  const [tutorDisplayName, setTutorDisplayName] = useState<string | null>(
    initialSession?.tutorDisplayName ?? initialSession?.account?.displayName ?? null,
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

  const applyMe = useCallback(
    (data: MeResponse) => {
      const nextRole = data.role === 'adult' || data.role === 'child' ? data.role : null
      setRole(nextRole)
      setAccount(nextRole === 'adult' ? (data.account ?? null) : null)

      const adultPlayers = nextRole === 'adult' ? asPlayers(data.players) : []
      const devicePlayers = asPlayers(data.device?.players)
      let childPlayer = nextRole === 'child' ? (data.player ?? null) : null
      // Si me.php no trae avatar, rellenar desde la lista del dispositivo.
      if (childPlayer && !childPlayer.avatarUrl) {
        const fromDevice = devicePlayers.find((p) => p.id === childPlayer!.id)
        if (fromDevice?.avatarUrl) {
          childPlayer = { ...childPlayer, avatarUrl: fromDevice.avatarUrl }
        }
      }
      setPlayer(childPlayer)

      const merged =
        adultPlayers.length > 0
          ? adultPlayers
          : devicePlayers.length > 0
            ? devicePlayers
            : childPlayer
              ? [childPlayer]
              : []

      setPlayers(adultPlayers)
      setFamilyPlayers(merged)
      setDeviceAuthorized(Boolean(data.device?.authorized))
      setTutorDisplayName(
        data.account?.displayName ??
          data.device?.accountDisplayName ??
          null,
      )
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
    if (initialSession) {
      setLoading(false)
      return
    }
    let alive = true
    const ac = new AbortController()
    const timer = window.setTimeout(() => ac.abort(), 8000)
    // Red de seguridad: aunque el fetch no aborte bien, no dejar "Cargando…" eterno.
    const failsafe = window.setTimeout(() => {
      if (alive) setLoading(false)
    }, 9000)
    ;(async () => {
      try {
        const data = await apiGet<MeResponse>('/auth/me.php', ac.signal)
        if (!alive) return
        applyMe(data)
      } catch {
        if (!alive) return
        setRole(null)
        setAccount(null)
        setPlayer(null)
        setPlayers([])
        setFamilyPlayers([])
        setDeviceAuthorized(false)
        setTutorDisplayName(null)
      } finally {
        window.clearTimeout(timer)
        window.clearTimeout(failsafe)
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
      window.clearTimeout(timer)
      window.clearTimeout(failsafe)
      ac.abort()
    }
    // Solo al montar / cambiar semilla: no re-disparar si cambia la identidad de refreshMe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSession])

  useEffect(() => {
    if (role === 'child') startPlayHeartbeat()
    else stopPlayHeartbeat()
    return () => stopPlayHeartbeat()
  }, [role])

  const loginAdult = useCallback(
    async (login: string, password: string) => {
      const data = await apiPost<MeResponse>('/auth/adult-login.php', { login, password })
      if (data.role !== 'adult') {
        throw new Error('No se pudo iniciar sesión.')
      }
      applyMe(data)
      return asPlayers(data.players)
    },
    [applyMe],
  )

  const registerFamily = useCallback(
    async (input: {
      login: string
      password: string
      displayName: string
      pin: string
      children: RegisterChildInput[]
    }) => {
      const data = await apiPost<MeResponse>('/auth/register.php', {
        login: input.login,
        password: input.password,
        displayName: input.displayName,
        pin: input.pin,
        children: input.children,
      })
      if (data.role !== 'adult') {
        throw new Error('No se pudo crear la familia.')
      }
      applyMe(data)
      return asPlayers(data.players)
    },
    [applyMe],
  )

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

  const enterAsChild = useCallback(
    async (playerSlug: string) => {
      const data = await apiPost<MeResponse>('/auth/child-enter.php', { playerSlug })
      applyMe(data)
    },
    [applyMe],
  )

  const authorizeDeviceForPlayer = useCallback(
    async (playerId: number, label = 'Dispositivo familiar') => {
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
    try {
      await refreshMe()
    } catch {
      setFamilyPlayers([])
      setDeviceAuthorized(false)
      setTutorDisplayName(null)
    }
  }, [refreshMe, syncCsrfState])

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      role,
      account,
      player,
      players,
      familyPlayers,
      deviceAuthorized,
      tutorDisplayName,
      csrf,
      refreshMe,
      loginAdult,
      registerFamily,
      loginAdultPin,
      enterAsChild,
      authorizeDeviceForPlayer,
      logout,
    }),
    [
      loading,
      role,
      account,
      player,
      players,
      familyPlayers,
      deviceAuthorized,
      tutorDisplayName,
      csrf,
      refreshMe,
      loginAdult,
      registerFamily,
      loginAdultPin,
      enterAsChild,
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
