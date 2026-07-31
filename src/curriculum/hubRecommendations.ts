import {
  alphabetModeStatus,
  hardAlphabetLetters,
  normalizeAlphabetModeProgress,
  normalizeAlphabetProgress,
  type AlphabetTrackMode,
} from '@/alphabet/progress'
import { PLAYABLE_TABLES } from '@/config/playConfig'
import { activities, skillsForBlock } from '@/curriculum/catalog'
import type { WorldZoneStatus } from '@/components/world/types'
import { hasSavedMisses } from '@/math/randomMission'
import type { ProgressState } from '@/math/types'
import { normalizeTableProgress, tableStatus } from '@/math/tableMastery'

/** Zonas de hub con semántica de recomendación. */
export type HubZoneId =
  | 'tables'
  | 'calc'
  | 'money'
  | 'clocks'
  | 'alphabet'
  | 'spelling'

const ALPHABET_MODES: AlphabetTrackMode[] = [
  'missing',
  'neighbor',
  'order-letters',
  'order-words',
  'random',
]

/** Skills del catálogo que alimentan cada zona del mapa. */
function skillIdsForZone(zone: HubZoneId): Set<string> {
  if (zone === 'tables') {
    return new Set(skillsForBlock('multiplication-tables').map((s) => s.id))
  }
  if (zone === 'calc') return new Set(['calc-mental'])
  if (zone === 'money') return new Set(['money-euros'])
  if (zone === 'clocks') return new Set(['clock-hours'])
  if (zone === 'alphabet') return new Set(['alphabet-letters'])
  return new Set(['spelling-words'])
}

function adultPushesZone(progress: ProgressState, zone: HubZoneId): boolean {
  const skillIds = skillIdsForZone(zone)
  return activities.some((activity) => {
    if (!skillIds.has(activity.skillId)) return false
    const role = progress.activityAssignments[activity.id]
    return role === 'recommended' || role === 'mandatory' || role === 'review'
  })
}

/** Hay señales de que Aray lo está pasando mal o el adulto pide repaso. */
export function zoneNeedsRecommendation(
  progress: ProgressState,
  zone: HubZoneId,
): boolean {
  if (adultPushesZone(progress, zone)) return true

  if (zone === 'tables') {
    if (hasSavedMisses(progress)) return true
    return PLAYABLE_TABLES.some((table) => {
      const row = normalizeTableProgress(progress.tables[String(table)])
      return tableStatus(row).recommendPractice
    })
  }

  if (zone === 'alphabet') {
    const alphabet = normalizeAlphabetProgress(progress.alphabet)
    if (hardAlphabetLetters(alphabet, 1).length > 0) return true
    return ALPHABET_MODES.some((mode) => {
      const row = normalizeAlphabetModeProgress(alphabet.modes[mode])
      return alphabetModeStatus(row).recommendPractice
    })
  }

  // calc / money / clocks / spelling: aún no hay fallos persistidos por zona.
  return false
}

/**
 * Estado visible en el mapa:
 * - coming-soon: no jugable
 * - recommended: hay debilidad / mandato adulto, o es el arranque si no hay ninguna débil
 * - available: abierta, sin urgencia
 */
export function resolveHubZoneStatus(
  progress: ProgressState,
  zone: HubZoneId,
  options: { playable: boolean; isStarter?: boolean; anyWeakInHub: boolean },
): WorldZoneStatus {
  if (!options.playable) return 'coming-soon'
  if (zoneNeedsRecommendation(progress, zone)) return 'recommended'
  if (!options.anyWeakInHub && options.isStarter) return 'recommended'
  return 'available'
}

export function hubHasWeakZones(
  progress: ProgressState,
  zones: HubZoneId[],
): boolean {
  return zones.some((zone) => zoneNeedsRecommendation(progress, zone))
}

export function hubGuideTip(params: {
  hasRecommended: boolean
  hasWeak: boolean
}): string | undefined {
  if (!params.hasRecommended) return undefined
  return params.hasWeak ? 'Aquí conviene repasar' : 'Empieza por aquí'
}
