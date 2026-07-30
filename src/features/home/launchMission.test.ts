import { describe, expect, it, vi } from 'vitest'
import type { LobbyMissionCard } from '@/curriculum'
import { launchLobbyMission } from '@/features/home/launchMission'
import { createInitialProgress } from '@/progress/repository'

function mission(partial: Partial<LobbyMissionCard> & Pick<LobbyMissionCard, 'path'>): LobbyMissionCard {
  return {
    activityId: 'mult-table-2-learn',
    title: 'Aprende la tabla del 2',
    description: 'Repasa la tabla sin prisa',
    subjectId: 'maths',
    blockId: 'multiplication-tables',
    skillId: 'mult-table-2',
    role: 'recommended',
    reason: 'recommended',
    ...partial,
  }
}

describe('launchLobbyMission', () => {
  it('fija la tabla de la misión antes de navegar a aprender', () => {
    const navigate = vi.fn()
    const setSelection = vi.fn()
    const setActiveMode = vi.fn()
    const setPendingQueue = vi.fn()
    const setLastResult = vi.fn()

    const setMissionOfDay = vi.fn()

    launchLobbyMission(mission({ table: 2, playMode: 'learn', path: '/missions/mates/tables/learn' }), {
      progress: createInitialProgress(),
      navigate,
      setSelection,
      setActiveMode,
      setPendingQueue,
      setLastResult,
      setMissionOfDay,
    })

    expect(setLastResult).toHaveBeenCalledWith(null)
    expect(setMissionOfDay).toHaveBeenCalledWith({ code: 'mult-table-2-learn' })
    expect(setSelection).toHaveBeenCalledWith({ tables: [2], mix: false })
    expect(navigate).toHaveBeenCalledWith('/missions/mates/tables/learn')
  })
})
