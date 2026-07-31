import { missionEnergyConfig } from '@/config/rewardGoal'
import { DAILY_TASKS, type DailySkillKey } from '@/daily/dailyTasks'
import { localDateString } from '@/reward/engine'

export type DailyMissionSnapshot = {
  date: string
  progress: Record<DailySkillKey, number>
  challengeDone: boolean
}

function emptyProgress(): Record<DailySkillKey, number> {
  return { tables: 0, calc: 0, spelling: 0, clocks: 0, money: 0 }
}

export function missionStorageKey(playerId: number | null): string {
  return playerId != null ? `aray.dailyMission.v1.p${playerId}` : 'aray.dailyMission.v1'
}

export function loadDailyMissionSnapshot(
  playerId: number | null,
  today: string = localDateString(),
): DailyMissionSnapshot {
  try {
    const raw = localStorage.getItem(missionStorageKey(playerId))
    if (!raw) return { date: today, progress: emptyProgress(), challengeDone: false }
    const parsed = JSON.parse(raw) as {
      date?: string
      progress?: Partial<Record<DailySkillKey, number>>
      challengeDone?: boolean
      bonusClaimed?: boolean
    }
    if (parsed.date !== today) {
      return { date: today, progress: emptyProgress(), challengeDone: false }
    }
    return {
      date: today,
      progress: { ...emptyProgress(), ...parsed.progress },
      // Migración: bonusClaimed antiguo no implica reto hecho.
      challengeDone: Boolean(parsed.challengeDone),
    }
  } catch {
    return { date: today, progress: emptyProgress(), challengeDone: false }
  }
}

export function saveDailyMissionSnapshot(
  snapshot: DailyMissionSnapshot,
  playerId: number | null,
  options?: { notify?: boolean },
): void {
  try {
    localStorage.setItem(missionStorageKey(playerId), JSON.stringify(snapshot))
    if (options?.notify === false) return
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aray-daily-mission-changed'))
    }
  } catch {
    /* ignore */
  }
}


export function missionTarget(skill: DailySkillKey): number {
  return DAILY_TASKS.find((t) => t.key === skill)?.target ?? 0
}

export function remainingMissionUnits(
  skill: DailySkillKey,
  progress: Record<DailySkillKey, number>,
): number {
  const cur = Math.max(0, progress[skill] ?? 0)
  return Math.max(0, missionTarget(skill) - cur)
}

/** Cuántas unidades de misión se pueden acreditar y cuánta energía dan. */
export function computeSkillEnergyGrant(
  skill: DailySkillKey,
  unitsAttempted: number,
  snapshot: DailyMissionSnapshot,
): { unitsCredited: number; energy: number } {
  const attempted = Math.max(0, Math.floor(unitsAttempted))
  if (attempted <= 0) return { unitsCredited: 0, energy: 0 }
  const remaining = remainingMissionUnits(skill, snapshot.progress)
  const unitsCredited = Math.min(attempted, remaining)
  const per = missionEnergyConfig.perUnit[skill]
  return { unitsCredited, energy: unitsCredited * per }
}

export function challengeEnergyIfAvailable(snapshot: DailyMissionSnapshot): number {
  if (snapshot.challengeDone) return 0
  return missionEnergyConfig.challengeDaily
}

/** Marca el reto del día como hecho (energía ya concedida o sesión reto cerrada). */
export function markChallengeDone(playerId: number | null, today: string = localDateString()): void {
  const snap = loadDailyMissionSnapshot(playerId, today)
  if (snap.challengeDone && snap.date === today) return
  saveDailyMissionSnapshot(
    {
      date: today,
      progress: snap.date === today ? snap.progress : emptyProgress(),
      challengeDone: true,
    },
    playerId,
  )
}

/** Suma unidades de misión en storage (para alinear grants atómicos con el progreso). */
export function advanceMissionProgress(
  playerId: number | null,
  skill: DailySkillKey,
  units: number,
  today: string = localDateString(),
): DailyMissionSnapshot {
  const snap = loadDailyMissionSnapshot(playerId, today)
  const base =
    snap.date === today ? snap : { date: today, progress: emptyProgress(), challengeDone: false }
  const cap = missionTarget(skill)
  const nextUnits = Math.min(cap, (base.progress[skill] ?? 0) + Math.max(0, Math.floor(units)))
  const next: DailyMissionSnapshot = {
    ...base,
    progress: { ...base.progress, [skill]: nextUnits },
  }
  saveDailyMissionSnapshot(next, playerId)
  return next
}

/** Si el Reto del día aún no está hecho, lo marca y devuelve su energía. */
export function takeDailyChallengeBonus(
  playerId: number | null,
  today: string = localDateString(),
): number {
  const snap = loadDailyMissionSnapshot(playerId, today)
  const bonus = challengeEnergyIfAvailable(snap)
  if (bonus > 0) markChallengeDone(playerId, today)
  return bonus
}

/** Energía de una ronda según slots de misión restantes (no avanza el progreso). */
export function energyForMissionAttempt(
  skill: DailySkillKey,
  unitsAttempted: number,
  playerId: number | null,
  today: string = localDateString(),
): number {
  return computeSkillEnergyGrant(
    skill,
    unitsAttempted,
    loadDailyMissionSnapshot(playerId, today),
  ).energy
}

/** Energía máxima que aún puede dar la misión+reto hoy (sin contar tope diario). */
export function remainingMissionEnergyBudget(snapshot: DailyMissionSnapshot): number {
  let sum = challengeEnergyIfAvailable(snapshot)
  for (const t of DAILY_TASKS) {
    const rem = remainingMissionUnits(t.key, snapshot.progress)
    sum += rem * missionEnergyConfig.perUnit[t.key]
  }
  return sum
}
