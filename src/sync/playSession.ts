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

/** Obtiene sesión actual + estado de dispositivo. */
export async function fetchAuthMe(): Promise<MeResponse> {
  return apiGet<MeResponse>('/auth/me.php')
}

/**
 * Asegura sesión infantil para poder enviar partidas.
 * 1) Ya child → OK
 * 2) Cookie de dispositivo → child-enter (también si había sesión adulta)
 */
export async function ensureChildPlaySession(): Promise<PlayPlayer | null> {
  const me = await fetchAuthMe()
  if (me.role === 'child' && me.player && typeof me.player.id === 'number') {
    return me.player
  }
  if (me.device?.authorized) {
    const entered = await apiPost<ChildEnterResponse>('/auth/child-enter.php', {
      playerSlug: me.device.player?.slug ?? DEFAULT_PLAYER_SLUG,
    })
    if (entered.player && typeof entered.player.id === 'number') {
      return entered.player
    }
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
