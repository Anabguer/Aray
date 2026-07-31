import { apiGet, apiPost } from '@/api/client'
import { DEFAULT_PLAYER_SLUG } from '@/sync/constants'

export type PlayPlayer = {
  id: number
  slug: string | null
  displayName: string | null
}

type MeResponse = {
  authenticated?: boolean
  role?: 'adult' | 'child' | null
  account?: { id: number; login: string | null; displayName: string | null }
  players?: PlayPlayer[]
  player?: PlayPlayer
  device?: {
    authorized?: boolean
    player?: PlayPlayer
    players?: PlayPlayer[]
  }
  csrf?: string
}

type ChildEnterResponse = {
  role?: string
  player?: PlayPlayer
  csrf?: string
}

type AuthorizeResponse = {
  deviceId?: number
  player?: PlayPlayer
  csrf?: string
}

export type EnsureChildOpts = {
  /** Perfil que debe quedar activo (evita grabar en otro niño). */
  playerSlug?: string | null
  playerId?: number | null
}

/** Obtiene sesión actual + estado de dispositivo. */
export async function fetchAuthMe(): Promise<MeResponse> {
  return apiGet<MeResponse>('/auth/me.php')
}

function playerMatches(player: PlayPlayer, opts?: EnsureChildOpts): boolean {
  if (!opts) return true
  if (opts.playerId != null && player.id !== opts.playerId) return false
  if (
    opts.playerSlug != null &&
    opts.playerSlug !== '' &&
    player.slug != null &&
    player.slug !== opts.playerSlug
  ) {
    return false
  }
  return true
}

function resolveEnterSlug(me: MeResponse, opts?: EnsureChildOpts): string {
  // Preferir playerId (fuente de verdad del ProgressContext) sobre slug
  // para no grabar en el niño nuevo con id viejo tras un switch rápido.
  if (opts?.playerId != null) {
    const fromAdult = me.players?.find((p) => p.id === opts.playerId)
    if (fromAdult?.slug) return fromAdult.slug
    const fromDevice = me.device?.players?.find((p) => p.id === opts.playerId)
    if (fromDevice?.slug) return fromDevice.slug
    if (me.device?.player?.id === opts.playerId && me.device.player.slug) {
      return me.device.player.slug
    }
    if (me.role === 'child' && me.player?.id === opts.playerId && me.player.slug) {
      return me.player.slug
    }
  }
  if (opts?.playerSlug != null && opts.playerSlug !== '') return opts.playerSlug
  if (me.role === 'child' && me.player?.slug) return me.player.slug
  if (me.device?.player?.slug) return me.device.player.slug
  if (me.players?.[0]?.slug) return me.players[0].slug
  return DEFAULT_PLAYER_SLUG
}

/**
 * Asegura sesión infantil para poder enviar partidas.
 * Si se indica playerSlug/playerId, cambia de perfil cuando el dispositivo lo permite.
 */
export async function ensureChildPlaySession(
  opts?: EnsureChildOpts,
): Promise<PlayPlayer | null> {
  const me = await fetchAuthMe()
  if (me.role === 'child' && me.player && typeof me.player.id === 'number') {
    if (playerMatches(me.player, opts)) {
      return me.player
    }
  }

  if (!me.device?.authorized) {
    return null
  }

  const playerSlug = resolveEnterSlug(me, opts)
  const entered = await apiPost<ChildEnterResponse>('/auth/child-enter.php', {
    playerSlug,
  })
  if (entered.player && typeof entered.player.id === 'number') {
    return entered.player
  }
  return null
}

/** Autoriza el dispositivo actual para un perfil (requiere sesión adulta). */
export async function authorizeCurrentDevice(
  playerId: number,
  deviceLabel = 'Dispositivo de Aray',
): Promise<AuthorizeResponse> {
  return apiPost<AuthorizeResponse>('/auth/device-authorize.php', {
    playerId,
    deviceLabel,
  })
}

/** Resuelve playerId oficial (sesión child, device o primer perfil adulto). */
export function resolvePlayerId(me: MeResponse): number | null {
  if (me.role === 'child' && me.player?.id) return me.player.id
  if (me.device?.authorized && me.device.player?.id) return me.device.player.id
  if (me.role === 'adult' && Array.isArray(me.players) && me.players[0]?.id) {
    return me.players[0].id
  }
  return null
}

export function resolvePlayerSlug(me: MeResponse): string | null {
  if (me.role === 'child' && me.player?.slug) return me.player.slug
  if (me.device?.authorized && me.device.player?.slug) return me.device.player.slug
  if (me.role === 'adult' && me.players?.[0]?.slug) return me.players[0].slug
  return null
}
