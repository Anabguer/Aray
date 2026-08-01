/** Evita que AuthGate mande al adulto a pick-profile/niño antes de llegar a /adult. */
export const PENDING_ADULT_PANEL_KEY = 'aray.pendingAdultPanel'

export function setPendingAdultPanel(pending: boolean): void {
  try {
    if (pending) sessionStorage.setItem(PENDING_ADULT_PANEL_KEY, '1')
    else sessionStorage.removeItem(PENDING_ADULT_PANEL_KEY)
  } catch {
    /* ignore */
  }
}

export function isPendingAdultPanel(): boolean {
  try {
    return sessionStorage.getItem(PENDING_ADULT_PANEL_KEY) === '1'
  } catch {
    return false
  }
}
