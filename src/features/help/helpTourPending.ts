/** Flag: mostrar la guía al llegar al lobby tras crear familia. */
export const HELP_TOUR_PENDING_KEY = 'aray.helpTour.pending'

export function setHelpTourPending(pending: boolean): void {
  try {
    if (pending) sessionStorage.setItem(HELP_TOUR_PENDING_KEY, '1')
    else sessionStorage.removeItem(HELP_TOUR_PENDING_KEY)
  } catch {
    /* ignore */
  }
}

/** Lee y limpia el flag. */
export function consumeHelpTourPending(): boolean {
  try {
    const v = sessionStorage.getItem(HELP_TOUR_PENDING_KEY)
    if (v !== '1') return false
    sessionStorage.removeItem(HELP_TOUR_PENDING_KEY)
    return true
  } catch {
    return false
  }
}
