import { AppShell } from '@/components/AppShell'
import { SubjectCard } from '@/components/SubjectCard'
import { subjectPreviews } from '@/data/demo'

export function MissionsScreen() {
  return (
    <AppShell title="Misiones" showBack>
      <section className="page-intro">
        <p className="page-intro__lead">
          Elige una asignatura. Cada una es un mundo jugable: ahora Matemáticas ya está activa; el resto
          muestra una vista previa.
        </p>
      </section>
      <section className="subjects" aria-label="Asignaturas">
        <div className="subjects__grid">
          {subjectPreviews.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      </section>
    </AppShell>
  )
}
