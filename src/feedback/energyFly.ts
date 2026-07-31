/** Vuelo de energía hacia la barra del HUD (cabecera). */

export type EnergyFlyDetail = {
  amount: number
  from?: { x: number; y: number } | null
}

export const ENERGY_FLY_EVENT = 'aray:energy-fly'

export function flyEnergyToBar(opts: {
  amount: number
  fromEl?: Element | null
  fromPoint?: { x: number; y: number } | null
}) {
  if (typeof window === 'undefined') return
  let from: { x: number; y: number } | null = opts.fromPoint ?? null
  if (!from && opts.fromEl) {
    const r = opts.fromEl.getBoundingClientRect()
    from = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }
  window.dispatchEvent(
    new CustomEvent<EnergyFlyDetail>(ENERGY_FLY_EVENT, {
      detail: { amount: Math.max(0, opts.amount), from },
    }),
  )
}

export function energyBarTargetEl(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-energy-bar]')
}
