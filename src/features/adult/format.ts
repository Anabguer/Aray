/** Formateo amigable para el panel familiar (Europe/Madrid). */

export function formatMadridDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Todavía no'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Todavía no'
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatMadridDate(ymd: string | null | undefined): string {
  if (!ymd) return '—'
  const d = new Date(`${ymd}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ymd
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(d)
}

export function formatPlayDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h} h ${m} min`
  if (m > 0) return `${m} min`
  return s > 0 ? `${s} s` : '0 min'
}

export function todayMadridYmd(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
