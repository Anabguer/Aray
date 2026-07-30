import {
  mundoIngles,
  mundoLenguas,
  mundoMatematicas,
  mundoMedi,
} from '@/assets/worlds'
import { WorldScene, type WorldSceneVariant } from '@/features/missions/WorldScene'

type MapWorld = {
  id: string
  title: string
  available: boolean
  path?: string
  recommended?: boolean
  progressPct?: number
  variant: WorldSceneVariant
  imageSrc: string
}

const ART: Record<string, string> = {
  maths: mundoMatematicas,
  languages: mundoLenguas,
  english: mundoIngles,
  medi: mundoMedi,
}

const LAYOUT: Record<string, WorldSceneVariant> = {
  maths: 'hero',
  languages: 'side',
  english: 'side',
  medi: 'side',
}

function buildScene(
  id: string,
  byId: Map<
    string,
    {
      title: string
      hasPlayable: boolean
      worldPath: string
      recommended?: boolean
      progressPct?: number
    }
  >,
): MapWorld {
  const world = byId.get(id)
  const title =
    world?.title ??
    (id === 'medi' ? 'Medi' : id === 'languages' ? 'Lenguas' : id === 'english' ? 'Inglés' : 'Matemáticas')
  const available = Boolean(world?.hasPlayable)
  return {
    id,
    title,
    available,
    path: available ? world?.worldPath : undefined,
    recommended: world?.recommended,
    progressPct: world?.progressPct,
    variant: LAYOUT[id] ?? 'side',
    imageSrc: ART[id]!,
  }
}

function renderScene(scene: MapWorld) {
  return (
    <WorldScene
      key={scene.id}
      id={scene.id}
      title={scene.title}
      imageSrc={scene.imageSrc}
      available={scene.available}
      path={scene.path}
      recommended={scene.recommended}
      progressPct={scene.progressPct}
      variant={scene.variant}
    />
  )
}

export function WorldMap({
  worlds,
}: {
  worlds: Array<{
    id: string
    title: string
    hasPlayable: boolean
    worldPath: string
    recommended?: boolean
    progressPct?: number
  }>
}) {
  const byId = new Map(worlds.map((w) => [w.id, w]))
  const maths = buildScene('maths', byId)
  const side = [
    buildScene('languages', byId),
    buildScene('english', byId),
    buildScene('medi', byId),
  ]

  return (
    <section className="world-map" aria-label="Selección de mundos">
      <div className="world-map__grid">
        {renderScene(maths)}
        <div className="world-map__side">{side.map(renderScene)}</div>
      </div>
    </section>
  )
}
