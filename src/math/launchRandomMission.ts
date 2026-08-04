import type { NavigateFunction } from 'react-router-dom'
import { pickRandomMission } from '@/math/randomMission'
import { buildMissesQueue, buildTrainQueue } from '@/math/selector'
import type { ProgressState } from '@/math/types'
import type { TablesSelection } from '@/progress/PlayContext'
import type { PlayMode, QuestionCard, SessionResult } from '@/math/types'

type PlayLaunch = {
  setSelection: (selection: TablesSelection) => void
  setActiveMode: (mode: PlayMode | null) => void
  setPendingQueue: (queue: QuestionCard[] | null) => void
  setLastResult: (result: SessionResult | null) => void
  setFromRandom: (value: boolean) => void
}

/** Lanza otra misión Random de tablas (Aprende / Entrena / Reto / Empareja / Fallos). */
export function launchTablesRandomMission(
  navigate: NavigateFunction,
  progress: ProgressState,
  play: PlayLaunch,
  random: () => number = Math.random,
): boolean {
  const mission = pickRandomMission(progress, random)
  if (!mission) return false

  play.setFromRandom(true)
  play.setLastResult(null)

  if (mission.kind === 'misses') {
    const { queue, usedFallbackMix } = buildMissesQueue(progress)
    play.setActiveMode(usedFallbackMix ? 'train' : 'misses')
    play.setPendingQueue(queue)
    navigate('/missions/mates/tables/train', {
      state: { fallbackMix: usedFallbackMix },
    })
    return true
  }

  if (mission.kind === 'match') {
    play.setSelection({ tables: [mission.table], mix: false })
    play.setActiveMode('match')
    navigate('/missions/mates/tables/match')
    return true
  }

  if (mission.kind === 'learn') {
    play.setSelection({ tables: mission.tables, mix: mission.mix })
    play.setActiveMode('learn')
    navigate('/missions/mates/tables/learn')
    return true
  }

  if (mission.kind === 'challenge') {
    play.setSelection({ tables: mission.tables, mix: mission.mix })
    play.setActiveMode('challenge')
    play.setPendingQueue(null)
    navigate('/missions/mates/tables/challenge')
    return true
  }

  play.setSelection({ tables: mission.tables, mix: mission.mix })
  play.setActiveMode('train')
  play.setPendingQueue(buildTrainQueue(mission.tables, progress))
  navigate('/missions/mates/tables/train')
  return true
}
