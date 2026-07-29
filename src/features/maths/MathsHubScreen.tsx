import { Link } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { SubjectIcon } from '@/components/ZoneIcons'
import { MuteToggle } from '@/components/quiz/QuizWidgets'
import { blocksForSubject, skillsForBlock } from '@/curriculum'
import { useProgress } from '@/progress/ProgressContext'

export function MathsHubScreen() {
  const { progress, setSoundMuted } = useProgress()
  const mathsBlocks = blocksForSubject('maths')

  return (
    <AppShell
      title="Matemáticas"
      showBack
      trailing={
        <MuteToggle muted={progress.soundMuted} onToggle={() => setSoundMuted(!progress.soundMuted)} />
      }
    >
      <section className="maths-hub">
        <div className="maths-hub__hero">
          <div className="maths-hub__icon">
            <SubjectIcon id="mates" />
          </div>
          <h2 className="maths-hub__title">Mundo de Matemáticas</h2>
          <p className="maths-hub__lead">
            Entrena por bloques. Las tablas ya están listas; el resto llegará sin perder tu progreso.
          </p>
        </div>

        <ul className="maths-hub__blocks">
          {mathsBlocks.map((block) => {
            const skillCount = skillsForBlock(block.id).filter((s) => s.status === 'active').length
            const isLive = block.id === 'multiplication-tables' && block.status === 'active'
            return (
              <li key={block.id} className="maths-hub__block">
                <div>
                  <h3>{block.title}</h3>
                  <p>{block.description}</p>
                  {skillCount > 0 ? (
                    <p className="maths-hub__meta">{skillCount} habilidades activas</p>
                  ) : (
                    <p className="maths-hub__meta">Estructura lista · sin actividades aún</p>
                  )}
                </div>
                {isLive ? (
                  <Link to="/missions/mates/tables" className="btn btn-primary">
                    Abrir tablas
                  </Link>
                ) : (
                  <span className="maths-hub__soon">Pronto</span>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </AppShell>
  )
}
