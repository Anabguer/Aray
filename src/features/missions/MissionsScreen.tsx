import { AppShell } from '@/components/AppShell'
import { SubjectCard } from '@/components/SubjectCard'
import { blocksForSubject, visibleWorlds } from '@/curriculum'
import { useProgress } from '@/progress/ProgressContext'

export function MissionsScreen() {
  const { progress } = useProgress()
  const worlds = visibleWorlds(progress)

  return (
    <AppShell title="Mis mundos" showBack>
      <section className="page-intro">
        <p className="page-intro__lead">
          Elige un mundo para entrenar. Matemáticas ya tiene misiones; Lenguas e Inglés están
          preparados para cuando lleguen nuevas aventuras.
        </p>
      </section>
      <section className="subjects" aria-label="Mundos de entrenamiento">
        <div className="subjects__grid">
          {worlds.map((world) => {
            const blockTitles = blocksForSubject(world.id)
              .filter((b) => b.status !== 'hidden')
              .map((b) => b.title)
            return (
              <SubjectCard
                key={world.id}
                subject={{
                  id: world.legacyHubId,
                  title: world.title,
                  shortLabel: world.shortTitle,
                  description: world.hasPlayable
                    ? world.description
                    : `Pronto: ${blockTitles.slice(0, 2).join(', ')}`,
                  accent: world.legacyHubId,
                }}
                path={world.worldPath}
                playable={world.hasPlayable}
              />
            )
          })}
        </div>
      </section>
    </AppShell>
  )
}
