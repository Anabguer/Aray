import { modeArtUrl, type ModeArtId } from '@/assets/modes'
import { dailySkillIcons } from '@/assets/daily'
import type { LobbyMissionCard } from '@/curriculum'

/** Arte del Reto del día: mismos iconos de habilidad que la Misión diaria. */
export function challengeArtUrl(mission: LobbyMissionCard | null): string {
  const id = mission?.activityId ?? ''
  if (id.startsWith('spelling-') || id.startsWith('alphabet-')) {
    return dailySkillIcons.spelling
  }
  if (id.startsWith('calc-')) return dailySkillIcons.calc
  if (id.startsWith('money-')) return dailySkillIcons.money
  if (id.startsWith('clock-')) return dailySkillIcons.clocks
  if (id.startsWith('table-') || typeof mission?.table === 'number') {
    return dailySkillIcons.tables
  }

  const modeArt = modeArtFromMission(mission)
  if (modeArt) return modeArtUrl(modeArt)

  return dailySkillIcons.tables
}

function modeArtFromMission(mission: LobbyMissionCard | null): ModeArtId | null {
  const play = mission?.playMode
  if (play === 'learn') return 'aprende'
  if (play === 'train') return 'entrena'
  if (play === 'challenge') return 'reto-rapido'
  if (play === 'match') return 'empareja'
  if (play === 'misses') return 'mis-fallos'
  if (play === 'random' || play === 'mix') return 'sorpresa'
  return null
}
