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
  medi: 'wide',
}

function buildScene(
  id: string,
  byId: Map<string, { title: string; hasPlayable: boolean; worldPath: string; recommended?: boolean; progressPct?: number }>,
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
  const languages = buildScene('languages', byId)
  const english = buildScene('english', byId)
  const medi = buildScene('medi', byId)

  return (
    <section className="world-map" aria-label="Selección de mundos">
      <div className="world-map__grid">
        <WorldScene
          id={maths.id}
          title={maths.title}
          imageSrc={maths.imageSrc}
          available={maths.available}
          path={maths.path}
          recommended={maths.recommended}
          progressPct={maths.progressPct}
          variant={maths.variant}
        />
        <div className="world-map__side">
          <WorldScene
            id={languages.id}
            title={languages.title}
            imageSrc={languages.imageSrc}
            available={languages.available}
            path={languages.path}
            recommended={languages.recommended}
            progressPct={languages.progressPct}
            variant={languages.variant}
          />
          <WorldScene
            id={english.id}
            title={english.title}
            imageSrc={english.imageSrc}
            available={english.available}
            path={english.path}
            recommended={english.recommended}
            progressPct={english.progressPct}
            variant={english.variant}
          />
        </div>
        <WorldScene
          id={medi.id}
          title={medi.title}
          imageSrc={medi.imageSrc}
          available={medi.available}
          path={medi.path}
          recommended={medi.recommended}
          progressPct={medi.progressPct}
          variant={medi.variant}
        />
      </div>
    </section>
  )
}
