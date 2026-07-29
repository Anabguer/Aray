import { PLAYABLE_TABLES, MIX_TABLES } from '@/config/playConfig'
import type { ProgressState } from '@/math/types'

export type RandomMission =
  | { kind: 'train'; tables: number[]; mix: boolean; label: string }
  | { kind: 'misses'; label: string }
  | { kind: 'match'; table: number; label: string }

function hasSavedMisses(progress: ProgressState): boolean {
  return Object.values(progress.facts).some((f) => f.wrong > 0)
}

/** Actividades terminadas disponibles para Misión random. */
export function listRandomMissions(progress: ProgressState): RandomMission[] {
  const missions: RandomMission[] = []

  for (const table of PLAYABLE_TABLES) {
    missions.push({
      kind: 'train',
      tables: [table],
      mix: false,
      label: `Entrena tabla del ${table}`,
    })
  }

  missions.push({
    kind: 'train',
    tables: [...MIX_TABLES],
    mix: true,
    label: 'Entrena mezcla',
  })

  if (hasSavedMisses(progress)) {
    missions.push({ kind: 'misses', label: 'Practicar mis fallos' })
  }

  for (const table of PLAYABLE_TABLES) {
    missions.push({
      kind: 'match',
      table,
      label: `Empareja tabla del ${table}`,
    })
  }

  return missions
}

export function pickRandomMission(
  progress: ProgressState,
  random: () => number = Math.random,
): RandomMission | null {
  const list = listRandomMissions(progress)
  if (list.length === 0) return null
  return list[Math.floor(random() * list.length)]!
}

export { hasSavedMisses }
