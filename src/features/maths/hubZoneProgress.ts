/**
 * Progreso visible en el hub de Matemáticas.
 * Reutiliza tableMastery + stats.byFeature (sin store nuevo).
 */
import type { FeatureStats } from '@/achievements/stats'
import { PLAYABLE_TABLES } from '@/config/playConfig'
import { normalizeTableProgress, tableStatus } from '@/math/tableMastery'
import type { ProgressState } from '@/math/types'

export type HubZoneProgressView = {
  /** 0–100 para la barra. */
  percent: number
  /** Texto corto bajo la descripción. */
  label: string
  /** 0–3 estrellas. */
  stars: number
}

function starsFromPercent(percent: number): number {
  if (percent <= 0) return 0
  if (percent < 34) return 1
  if (percent < 67) return 2
  return 3
}

/** Tablas 2–9: fracción domadas (+ crédito suave a «en marcha»). */
export function tablesHubProgress(progress: ProgressState): HubZoneProgressView {
  const total = PLAYABLE_TABLES.length
  let mastered = 0
  let learning = 0
  for (const n of PLAYABLE_TABLES) {
    const st = tableStatus(normalizeTableProgress(progress.tables[String(n)]))
    if (st.kind === 'mastered' || st.kind === 'mastered_review') mastered += 1
    else if (st.kind !== 'new') learning += 1
  }
  const soft = Math.min(100, Math.round(((mastered + learning * 0.35) / total) * 100))
  if (mastered === 0 && learning === 0) {
    return { percent: 0, label: 'Sin empezar', stars: 0 }
  }
  return {
    percent: soft,
    label: `${mastered}/${total} domadas`,
    stars: starsFromPercent(soft),
  }
}

/**
 * Calc / dinero / horas: sesiones + perfectas + modos probados.
 * Tope blando ~12 sesiones ≈ 100 % de «práctica habitual».
 */
export function featureHubProgress(stats: FeatureStats | undefined): HubZoneProgressView {
  const s = stats ?? { sessions: 0, perfect: 0, modes: [] }
  if (s.sessions <= 0 && s.perfect <= 0 && s.modes.length === 0) {
    return { percent: 0, label: 'Sin empezar', stars: 0 }
  }
  const sessionPart = Math.min(1, s.sessions / 12) * 70
  const perfectPart = Math.min(25, s.perfect * 5)
  const modePart = Math.min(20, s.modes.length * 4)
  const percent = Math.min(100, Math.round(sessionPart + perfectPart + modePart))
  const level = Math.min(5, 1 + Math.floor(s.sessions / 3))
  return {
    percent,
    label: `Nivel ${level}`,
    stars: starsFromPercent(percent),
  }
}

export function mathsHubProgressForZone(
  zone: 'tables' | 'calc' | 'money' | 'clocks',
  progress: ProgressState,
): HubZoneProgressView {
  if (zone === 'tables') return tablesHubProgress(progress)
  const stats = progress.stats?.byFeature?.[zone]
  return featureHubProgress(stats)
}
