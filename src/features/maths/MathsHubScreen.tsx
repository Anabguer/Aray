import { Link } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { SubjectIcon } from '@/components/ZoneIcons'
import { MuteToggle } from '@/components/quiz/QuizWidgets'
import { useProgress } from '@/progress/ProgressContext'

export function MathsHubScreen() {
  const { progress, setSoundMuted } = useProgress()

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
          <h2 className="maths-hub__title">Tablas de multiplicar</h2>
          <p className="maths-hub__lead">
            Practica del 1 al 10. Aprende sin prisa, entrena con calma o lanza un reto rápido.
          </p>
          <Link to="/missions/mates/tables" className="btn btn-primary btn-block">
            Abrir tablas
          </Link>
        </div>
        <p className="demo-note">Otras misiones de mates llegarán más adelante.</p>
      </section>
    </AppShell>
  )
}
