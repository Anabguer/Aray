import type { HubIconId } from '@/assets/icons/hub'
import {
  alphabetModeStatus,
  hardAlphabetLetters,
  normalizeAlphabetModeProgress,
  normalizeAlphabetProgress,
  type AlphabetTrackMode,
} from '@/alphabet/progress'
import {
  getActivity,
  getBlock,
  getSkill,
  getSubject,
} from '@/curriculum/catalog'
import { isActivityVisibleToChild } from '@/curriculum/school'
import type { LobbyMissionCard } from '@/curriculum/types'
import type { ProgressState } from '@/math/types'
import { tableStatus } from '@/math/tableMastery'
import { localDateString } from '@/reward/engine'

const STORAGE_KEY = 'aray.dailyChallenge.v1'

const ALPHABET_ACTIVITY: Record<AlphabetTrackMode, string> = {
  missing: 'alphabet-missing',
  neighbor: 'alphabet-neighbor',
  'order-letters': 'alphabet-order-letters',
  'order-words': 'alphabet-order-words',
  random: 'alphabet-random',
}

/** Actividades de otras asignaturas sin dominio fino aún: entran con peso base. */
const VARIETY_ACTIVITIES: Array<{ activityId: string; weight: number; hubIcon: HubIconId }> = [
  { activityId: 'clock-hours-train', weight: 14, hubIcon: 'matematicas' },
  { activityId: 'calc-mental-mix', weight: 14, hubIcon: 'matematicas' },
  { activityId: 'money-change', weight: 14, hubIcon: 'matematicas' },
  { activityId: 'spelling-mix', weight: 14, hubIcon: 'castellano' },
  { activityId: 'alphabet-random', weight: 12, hubIcon: 'castellano' },
]

export interface DailyChallengeCard extends LobbyMissionCard {
  reason: 'daily_challenge'
  hubIcon: HubIconId
}

type ChallengeCandidate = {
  activityId: string
  weight: number
  hubIcon: HubIconId
  title?: string
  description?: string
  table?: number
  playMode?: string
}

type StoredChallenge = {
  date: string
  activityId: string
}

function loadStored(today: string): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredChallenge
    if (parsed.date !== today || typeof parsed.activityId !== 'string') return null
    return parsed.activityId
  } catch {
    return null
  }
}

function saveStored(today: string, activityId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, activityId }))
  } catch {
    /* ignore */
  }
}

function visible(activityId: string, progress: ProgressState): boolean {
  return isActivityVisibleToChild(
    activityId,
    progress.school.currentCourseId,
    progress.activityAssignments,
  )
}

function hubForSubject(subjectId: string): HubIconId {
  if (subjectId === 'languages') return 'castellano'
  if (subjectId === 'english') return 'ingles'
  return 'matematicas'
}

function cardFromActivity(
  activityId: string,
  progress: ProgressState,
  overrides: Partial<Pick<DailyChallengeCard, 'title' | 'description' | 'hubIcon'>> = {},
): DailyChallengeCard | null {
  const activity = getActivity(activityId)
  if (!activity || !visible(activityId, progress)) return null
  const skill = getSkill(activity.skillId)
  if (!skill) return null
  const block = getBlock(skill.blockId)
  const subject = block ? getSubject(block.subjectId) : undefined
  if (!block || !subject) return null
  const table = activity.config.table
  const playMode = activity.config.playMode
  const path =
    typeof activity.config.path === 'string' ? activity.config.path : '/missions/mates/tables'
  return {
    activityId,
    title: overrides.title ?? activity.title,
    description: overrides.description ?? activity.description,
    subjectId: subject.id,
    blockId: block.id,
    skillId: skill.id,
    role: 'recommended',
    path,
    reason: 'daily_challenge',
    hubIcon: overrides.hubIcon ?? (typeof table === 'number' ? 'tablas' : hubForSubject(subject.id)),
    ...(typeof table === 'number' ? { table } : {}),
    ...(typeof playMode === 'string' ? { playMode } : {}),
  }
}

function buildCandidates(progress: ProgressState): ChallengeCandidate[] {
  const out: ChallengeCandidate[] = []
  const push = (c: ChallengeCandidate) => {
    if (c.weight <= 0 || !visible(c.activityId, progress)) return
    if (out.some((x) => x.activityId === c.activityId)) {
      const existing = out.find((x) => x.activityId === c.activityId)!
      existing.weight = Math.max(existing.weight, c.weight)
      if (c.title) existing.title = c.title
      if (c.description) existing.description = c.description
      if (c.hubIcon) existing.hubIcon = c.hubIcon
      return
    }
    out.push(c)
  }

  for (let n = 2; n <= 9; n++) {
    const key = String(n)
    const table = progress.tables[key]
    const trainId = `mult-table-${n}-train`
    if (!table) {
      push({
        activityId: trainId,
        weight: 10,
        hubIcon: 'tablas',
        title: `Prueba la tabla del ${n}`,
        description: 'Empieza por aquí y gana XP',
        table: n,
        playMode: 'train',
      })
      continue
    }
    const status = tableStatus(table)
    if (status.recommendPractice) {
      push({
        activityId: trainId,
        weight: 40 + table.consecutiveLowRounds * 28 + Math.max(0, 8 - (table.lastRoundScore ?? 0)) * 4,
        hubIcon: 'tablas',
        title: `Refuerza la tabla del ${n}`,
        description: 'Es de las que más te cuestan',
        table: n,
        playMode: 'train',
      })
    } else if (!table.practiced) {
      push({
        activityId: trainId,
        weight: 12,
        hubIcon: 'tablas',
        title: `Domina la tabla del ${n}`,
        description: 'Gana XP y déjala dominada',
        table: n,
        playMode: 'train',
      })
    }
  }

  let totalWrong = 0
  for (const stats of Object.values(progress.facts)) {
    totalWrong += stats.wrong
  }
  if (totalWrong > 0) {
    push({
      activityId: 'mult-misses-practice',
      weight: 25 + Math.min(90, totalWrong * 6),
      hubIcon: 'tablas',
      title: 'Practica tus fallos',
      description: 'Multiplicaciones que más fallas',
      playMode: 'misses',
    })
  }

  const alphabet = normalizeAlphabetProgress(progress.alphabet)
  for (const mode of Object.keys(ALPHABET_ACTIVITY) as AlphabetTrackMode[]) {
    const prog = normalizeAlphabetModeProgress(alphabet.modes[mode])
    const status = alphabetModeStatus(prog)
    if (!status.recommendPractice) continue
    const activityId = ALPHABET_ACTIVITY[mode]
    push({
      activityId,
      weight: 38 + prog.consecutiveLowRounds * 22,
      hubIcon: 'castellano',
      title: getActivity(activityId)?.title ?? 'Repasa el ABC',
      description: 'Modo de abecedario a reforzar',
    })
  }
  const hardLetters = hardAlphabetLetters(alphabet, 3)
  if (hardLetters.length > 0) {
    push({
      activityId: 'alphabet-random',
      weight: 20 + hardLetters.reduce((s, h) => s + h.wrong, 0) * 4,
      hubIcon: 'castellano',
      title: 'ABC · letras difíciles',
      description: `Cuidado con ${hardLetters.map((h) => h.letter).join(', ')}`,
    })
  }

  for (const v of VARIETY_ACTIVITIES) {
    push({
      activityId: v.activityId,
      weight: v.weight,
      hubIcon: v.hubIcon,
      description: 'Reto de hoy en otra asignatura',
    })
  }

  return out
}

function weightedPick(candidates: ChallengeCandidate[], rng: () => number): ChallengeCandidate {
  const total = candidates.reduce((s, c) => s + c.weight, 0)
  let roll = rng() * total
  for (const c of candidates) {
    roll -= c.weight
    if (roll <= 0) return c
  }
  return candidates[candidates.length - 1]!
}

/** RNG determinista por día (misma sesión del día sin storage aún). */
function dayRng(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function toCard(candidate: ChallengeCandidate, progress: ProgressState): DailyChallengeCard | null {
  return cardFromActivity(candidate.activityId, progress, {
    title: candidate.title,
    description: candidate.description,
    hubIcon: candidate.hubIcon,
  })
}

/**
 * Reto del día: pondera lo que más falla (tablas, fallos, ABC)
 * y mete peso base de otras asignaturas. Estable durante el día.
 */
export function pickDailyChallenge(
  progress: ProgressState,
  today: string = localDateString(),
): DailyChallengeCard | null {
  const candidates = buildCandidates(progress)
  if (candidates.length === 0) return null

  const storedId =
    typeof localStorage !== 'undefined' ? loadStored(today) : null
  if (storedId) {
    const match = candidates.find((c) => c.activityId === storedId)
    const revived = match
      ? toCard(match, progress)
      : cardFromActivity(storedId, progress, {
          description: 'Tu reto de hoy',
        })
    if (revived) return revived
  }

  const picked = weightedPick(candidates, dayRng(today))
  if (typeof localStorage !== 'undefined') {
    saveStored(today, picked.activityId)
  }
  return toCard(picked, progress)
}

/** Solo tests: construye la piscina sin persistir. */
export function dailyChallengeCandidatesForTests(progress: ProgressState): ChallengeCandidate[] {
  return buildCandidates(progress)
}
