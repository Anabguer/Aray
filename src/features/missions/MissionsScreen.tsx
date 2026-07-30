import { AppShell } from '@/components/AppShell'
import { WorldPortal, type WorldPortalTheme } from '@/components/WorldPortal'
import { Lumo } from '@/lumo/Lumo'
import { visibleWorlds } from '@/curriculum'
import { useProgress } from '@/progress/ProgressContext'

const worldTheme: Record<string, WorldPortalTheme> = {
  maths: 'maths',
  languages: 'languages',
  english: 'english',
}

export function MissionsScreen() {
  const { progress } = useProgress()
  const worlds = visibleWorlds(progress)

  return (
    <AppShell title="Mis mundos" showBack>
      <section className="worlds-map" aria-label="Selección de mundos">
        <p className="worlds-map__subtitle">Elige tu próxima aventura</p>

        <div className="worlds-map__hint">
          <Lumo state="idle" size="sm" label="Lumo te señala Matemáticas" />
          <p className="worlds-map__hint-text" role="status">
            ¡Vamos a Mates!
          </p>
        </div>

        <div className="worlds-map__sky" aria-hidden="true">
          <span className="worlds-map__star worlds-map__star--a" />
          <span className="worlds-map__star worlds-map__star--b" />
          <span className="worlds-map__star worlds-map__star--c" />
          <span className="worlds-map__star worlds-map__star--d" />
          <span className="worlds-map__particle worlds-map__particle--a" />
          <span className="worlds-map__particle worlds-map__particle--b" />
          <span className="worlds-map__particle worlds-map__particle--c" />
          <span className="worlds-map__path worlds-map__path--a" />
          <span className="worlds-map__path worlds-map__path--b" />
          <span className="worlds-map__float worlds-map__float--a" />
          <span className="worlds-map__float worlds-map__float--b" />
          <span className="worlds-map__float worlds-map__float--c" />
        </div>

        <div className="worlds-map__stage">
          {worlds.map((world) => {
            const theme = worldTheme[world.id] ?? 'maths'
            const playable = world.hasPlayable
            return (
              <WorldPortal
                key={world.id}
                theme={theme}
                title={world.title}
                path={world.worldPath}
                playable={playable}
                featured={playable}
              />
            )
          })}
        </div>
      </section>
    </AppShell>
  )
}
