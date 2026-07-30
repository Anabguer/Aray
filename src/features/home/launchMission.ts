import type { NavigateFunction } from 'react-router-dom'
import type { LobbyMissionCard } from '@/curriculum'
import { buildMissesQueue, buildTrainQueue } from '@/math/selector'
import type { PlayMode, ProgressState, QuestionCard, SessionResult } from '@/math/types'
import type { TablesSelection } from '@/progress/PlayContext'

interface LaunchDeps {
  progress: ProgressState
  navigate: NavigateFunction
  setSelection: (selection: TablesSelection) => void
  setActiveMode: (mode: PlayMode | null) => void
  setPendingQueue: (queue: QuestionCard[] | null) => void
  setLastResult: (result: SessionResult | null) => void
}

/** Prepara PlayContext según la actividad del lobby y navega a su path. */
export function launchLobbyMission(mission: LobbyMissionCard, deps: LaunchDeps): void {
  const { progress, navigate, setSelection, setActiveMode, setPendingQueue, setLastResult } =
    deps

  setLastResult(null)

  const table = mission.table
  if (typeof table === 'number') {
    setSelection({ tables: [table], mix: false })
  }

  const mode = mission.playMode
  if (mode === 'train' && typeof table === 'number') {
    setActiveMode('train')
    setPendingQueue(buildTrainQueue([table], progress))
    navigate(mission.path)
    return
  }

  if (mode === 'misses') {
    const { queue, usedFallbackMix } = buildMissesQueue(progress)
    setActiveMode(usedFallbackMix ? 'train' : 'misses')
    setPendingQueue(queue)
    navigate(mission.path, { state: { fallbackMix: usedFallbackMix } })
    return
  }

  if (mode === 'challenge') {
    setActiveMode('challenge')
    setPendingQueue(null)
  } else if (mode === 'match') {
    setActiveMode('match')
  }

  navigate(mission.path)
}
