import { AppShell } from '@/components/AppShell'
import { GameHeader } from '@/components/game/GameHeader'
import { visibleWorlds } from '@/curriculum'
import { WorldMap } from '@/features/missions/WorldMap'
import { useProgress } from '@/progress/ProgressContext'

export function MissionsScreen() {
  const { progress } = useProgress()
  const worlds = visibleWorlds(progress)

  return (
    <AppShell hideTopbar>
      <GameHeader title="MIS MUNDOS" subtitle="Elige tu próxima aventura" />
      <WorldMap
        worlds={worlds.map((world) => ({
          id: world.id,
          title: world.title,
          hasPlayable: world.hasPlayable,
          worldPath: world.worldPath,
        }))}
      />
    </AppShell>
  )
}
