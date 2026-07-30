import { Link } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { WorldPortal, type WorldPortalTheme } from '@/components/WorldPortal'
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
    <AppShell showBack backTo="/">
      <section className="worlds-map" aria-label="Selección de mundos">
        <header className="worlds-map__head">
          <div className="worlds-map__titles">
            <h1 className="worlds-map__title">Mis mundos</h1>
            <p className="worlds-map__subtitle">Elige tu próxima aventura</p>
          </div>
          <Link to="/" className="worlds-map__lobby-btn">
            Volver al Lobby
          </Link>
        </header>

        <div className="worlds-map__sky" aria-hidden="true">
          <span className="worlds-map__star worlds-map__star--a" />
          <span className="worlds-map__star worlds-map__star--b" />
          <span className="worlds-map__star worlds-map__star--c" />
          <span className="worlds-map__particle worlds-map__particle--a" />
          <span className="worlds-map__particle worlds-map__particle--b" />
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
