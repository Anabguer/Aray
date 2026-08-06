import type { NavigateFunction } from 'react-router-dom'
import { pickDailyMissionTables } from '@/math/pickDailyMissionTables'
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

/**
 * Misión diaria → Tablas: elige sola una tabla débil / fallos y entra a jugar
 * (sin pantalla de selección manual).
 */
export function launchDailyMissionTables(
  navigate: NavigateFunction,
  progress: ProgressState,
  play: PlayLaunch,
  random: () => number = Math.random,
): void {
  const pick = pickDailyMissionTables(progress, random)

  play.setFromRandom(false)
  play.setLastResult(null)

  if (pick.kind === 'misses') {
    const { queue, usedFallbackMix } = buildMissesQueue(progress)
    play.setActiveMode(usedFallbackMix ? 'train' : 'misses')
    play.setPendingQueue(queue)
    navigate('/missions/mates/tables/train', {
      state: { fallbackMix: usedFallbackMix },
    })
    return
  }

  play.setSelection({ tables: [pick.table], mix: false })
  play.setActiveMode('train')
  play.setPendingQueue(buildTrainQueue([pick.table], progress))
  navigate('/missions/mates/tables/train')
}
