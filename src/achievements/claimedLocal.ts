const KEY_PREFIX = 'aray.achievements.claimed.v1.p'

function storageKey(playerId: number): string {
  return `${KEY_PREFIX}${playerId}`
}

/** IDs de colección ya recogidos en este dispositivo (sobrevive hidratación/reset de caché). */
export function loadLocalClaimedAchievementIds(playerId: number | null | undefined): string[] {
  if (playerId == null || !Number.isFinite(playerId) || playerId < 1) return []
  try {
    const raw = localStorage.getItem(storageKey(playerId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((id): id is string => typeof id === 'string' && /^[a-z0-9-]+$/.test(id))
      .slice(-80)
  } catch {
    return []
  }
}

export function rememberLocalClaimedAchievement(
  playerId: number | null | undefined,
  achievementId: string,
): void {
  if (playerId == null || !Number.isFinite(playerId) || playerId < 1 || !achievementId) return
  const next = [
    ...loadLocalClaimedAchievementIds(playerId).filter((id) => id !== achievementId),
    achievementId,
  ]
  if (next.length > 80) next.splice(0, next.length - 80)
  try {
    localStorage.setItem(storageKey(playerId), JSON.stringify(next))
  } catch {
    /* ignore quota */
  }
}

export function mergeClaimedAchievementIds(...lists: Array<string[] | undefined>): string[] {
  const seen = new Set<string>()
  for (const list of lists) {
    if (!list) continue
    for (const id of list) {
      if (typeof id === 'string' && id && /^[a-z0-9-]+$/.test(id)) {
        seen.add(id)
      }
    }
  }
  return Array.from(seen)
}
