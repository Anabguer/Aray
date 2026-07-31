const CLAIMED_KEY = 'aray.crates.claimedLocal.v1'

/** IDs de cajas ya recogidas en este dispositivo (sobrevive hidratación/reset de caché). */
export function loadLocalClaimedCrateIds(): string[] {
  try {
    const raw = localStorage.getItem(CLAIMED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0).slice(-80)
  } catch {
    return []
  }
}

export function rememberLocalClaimedCrate(completionId: string): void {
  if (!completionId) return
  const next = [...loadLocalClaimedCrateIds().filter((id) => id !== completionId), completionId]
  if (next.length > 80) next.splice(0, next.length - 80)
  try {
    localStorage.setItem(CLAIMED_KEY, JSON.stringify(next))
  } catch {
    /* ignore quota */
  }
}
