import { Link, useParams } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { SubjectIcon } from '@/components/ZoneIcons'
import { comingSoonCopy, subjectPreviews } from '@/data/demo'
import type { SubjectId } from '@/data/types'

export function SubjectPreviewScreen() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const subject = subjectPreviews.find((item) => item.id === subjectId)

  if (!subject) {
    return (
      <AppShell title="Misiones" showBack>
        <section className="coming-soon">
          <div className="coming-soon__panel">
            <h2 className="coming-soon__title">Asignatura no encontrada</h2>
            <p className="coming-soon__body">Vuelve a Misiones y elige otra opción.</p>
            <Link to="/missions" className="btn btn-secondary">
              Ir a Misiones
            </Link>
          </div>
        </section>
      </AppShell>
    )
  }

  return (
    <AppShell title={subject.title} showBack>
      <section className="subject-preview" aria-labelledby="subject-preview-title">
        <div className={`subject-preview__panel subject-preview__panel--${subject.accent}`}>
          <div className="subject-preview__icon">
            <SubjectIcon id={subject.id as SubjectId} />
          </div>
          <p className="coming-soon__badge">Vista previa</p>
          <p id="subject-preview-title" className="coming-soon__title">
            {subject.title}
          </p>
          <p className="coming-soon__body">{subject.description}</p>
          <p className="coming-soon__body">{comingSoonCopy.subject.body}</p>
          <div className="subject-preview__actions">
            <Link to="/missions" className="btn btn-secondary">
              Volver a Misiones
            </Link>
            <Link to="/" className="btn btn-ghost">
              Lobby
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  )
}
