export type FeatureStatKey =
  | 'tables'
  | 'calc'
  | 'clocks'
  | 'money'
  | 'spelling'
  | 'alphabet'
  | 'english'

export interface FeatureStats {
  sessions: number
  perfect: number
  modes: string[]
}

export interface ProgressStats {
  playSeconds: number
  sessionsCompleted: number
  goodSessionStreak: number
  bestGoodSessionStreak: number
  dailyMissionsCompleted: number
  byFeature: Record<FeatureStatKey, FeatureStats>
}

export type StatsDelta = {
  playSeconds?: number
  sessionsCompleted?: number
  dailyMissionsCompleted?: number
  /** true = suma racha buena; false = resetea */
  goodSession?: boolean
  feature?: FeatureStatKey
  featureSessions?: number
  featurePerfect?: number
  mode?: string
}

const FEATURES: FeatureStatKey[] = [
  'tables',
  'calc',
  'clocks',
  'money',
  'spelling',
  'alphabet',
  'english',
]

function emptyFeature(): FeatureStats {
  return { sessions: 0, perfect: 0, modes: [] }
}

export function createEmptyStats(): ProgressStats {
  return {
    playSeconds: 0,
    sessionsCompleted: 0,
    goodSessionStreak: 0,
    bestGoodSessionStreak: 0,
    dailyMissionsCompleted: 0,
    byFeature: {
      tables: emptyFeature(),
      calc: emptyFeature(),
      clocks: emptyFeature(),
      money: emptyFeature(),
      spelling: emptyFeature(),
      alphabet: emptyFeature(),
      english: emptyFeature(),
    },
  }
}

export function normalizeStats(raw: unknown): ProgressStats {
  const base = createEmptyStats()
  if (!raw || typeof raw !== 'object') return base
  const parsed = raw as Partial<ProgressStats> & { byFeature?: Record<string, Partial<FeatureStats>> }
  const byFeature = { ...base.byFeature }
  for (const key of FEATURES) {
    const src = parsed.byFeature?.[key]
    const modes = Array.isArray(src?.modes)
      ? src!.modes.filter((m): m is string => typeof m === 'string' && m !== '')
      : []
    byFeature[key] = {
      sessions: typeof src?.sessions === 'number' ? Math.max(0, src.sessions) : 0,
      perfect: typeof src?.perfect === 'number' ? Math.max(0, src.perfect) : 0,
      modes: Array.from(new Set(modes)),
    }
  }
  return {
    playSeconds: typeof parsed.playSeconds === 'number' ? Math.max(0, parsed.playSeconds) : 0,
    sessionsCompleted:
      typeof parsed.sessionsCompleted === 'number' ? Math.max(0, parsed.sessionsCompleted) : 0,
    goodSessionStreak:
      typeof parsed.goodSessionStreak === 'number' ? Math.max(0, parsed.goodSessionStreak) : 0,
    bestGoodSessionStreak:
      typeof parsed.bestGoodSessionStreak === 'number'
        ? Math.max(0, parsed.bestGoodSessionStreak)
        : 0,
    dailyMissionsCompleted:
      typeof parsed.dailyMissionsCompleted === 'number'
        ? Math.max(0, parsed.dailyMissionsCompleted)
        : 0,
    byFeature,
  }
}

export function applyStatsDelta(current: ProgressStats, delta: StatsDelta): ProgressStats {
  const next = normalizeStats(current)
  next.playSeconds += Math.max(0, Math.floor(delta.playSeconds ?? 0))
  next.sessionsCompleted += Math.max(0, Math.floor(delta.sessionsCompleted ?? 0))
  next.dailyMissionsCompleted += Math.max(0, Math.floor(delta.dailyMissionsCompleted ?? 0))

  if (delta.goodSession != null) {
    if (delta.goodSession) {
      next.goodSessionStreak += 1
      next.bestGoodSessionStreak = Math.max(next.bestGoodSessionStreak, next.goodSessionStreak)
    } else {
      next.goodSessionStreak = 0
    }
  }

  if (delta.feature && FEATURES.includes(delta.feature)) {
    const f = next.byFeature[delta.feature]
    f.sessions += Math.max(0, Math.floor(delta.featureSessions ?? 1))
    f.perfect += Math.max(0, Math.floor(delta.featurePerfect ?? 0))
    const mode = (delta.mode ?? '').trim().slice(0, 24)
    if (mode && !f.modes.includes(mode)) {
      f.modes = [...f.modes, mode]
    }
  }

  return next
}

/** Conserva el máximo de cada contador (local vs servidor). */
export function mergeStatsPreferHigher(a: ProgressStats, b: ProgressStats): ProgressStats {
  const left = normalizeStats(a)
  const right = normalizeStats(b)
  const byFeature = { ...left.byFeature }
  for (const key of FEATURES) {
    const modes = Array.from(new Set([...left.byFeature[key].modes, ...right.byFeature[key].modes]))
    byFeature[key] = {
      sessions: Math.max(left.byFeature[key].sessions, right.byFeature[key].sessions),
      perfect: Math.max(left.byFeature[key].perfect, right.byFeature[key].perfect),
      modes,
    }
  }
  return {
    playSeconds: Math.max(left.playSeconds, right.playSeconds),
    sessionsCompleted: Math.max(left.sessionsCompleted, right.sessionsCompleted),
    goodSessionStreak: Math.max(left.goodSessionStreak, right.goodSessionStreak),
    bestGoodSessionStreak: Math.max(left.bestGoodSessionStreak, right.bestGoodSessionStreak),
    dailyMissionsCompleted: Math.max(left.dailyMissionsCompleted, right.dailyMissionsCompleted),
    byFeature,
  }
}

/** Sesión “buena”: ≥80% aciertos. */
export function isGoodSession(correct: number, total: number): boolean {
  if (total <= 0) return false
  return correct / total >= 0.8
}

export function buildActivityStatsDelta(input: {
  feature: FeatureStatKey
  mode: string
  correct: number
  total: number
  playSeconds: number
}): StatsDelta {
  const total = Math.max(0, input.total)
  const correct = Math.max(0, input.correct)
  return {
    playSeconds: Math.max(1, Math.floor(input.playSeconds)),
    sessionsCompleted: 1,
    goodSession: isGoodSession(correct, total),
    feature: input.feature,
    featureSessions: 1,
    featurePerfect: total > 0 && correct >= total ? 1 : 0,
    mode: input.mode,
  }
}
