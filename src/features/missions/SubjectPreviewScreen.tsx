import { Link, useParams } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { SubjectIcon } from '@/components/ZoneIcons'
import { blocksForSubject, getSubject } from '@/curriculum'
import { comingSoonCopy, subjectPreviews } from '@/data/demo'
import type { SubjectId } from '@/data/types'

const CURRICULUM_ROUTE_MAP: Record<string, 'languages' | 'english'> = {
  languages: 'languages',
  english: 'english',
  catala: 'languages',
  castellano: 'languages',
  angles: 'english',
}

export function SubjectPreviewScreen() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const curriculumId = subjectId ? CURRICULUM_ROUTE_MAP[subjectId] : undefined
  const curriculumSubject = curriculumId ? getSubject(curriculumId) : undefined
  const legacySubject = subjectPreviews.find((item) => item.id === subjectId)

  if (!curriculumSubject && !legacySubject) {
    return (
      <AppShell title="Mis mundos" showBack>
        <section className="coming-soon">
          <div className="coming-soon__panel">
            <h2 className="coming-soon__title">Mundo no encontrado</h2>
            <p className="coming-soon__body">Vuelve a Mis mundos y elige otra opción.</p>
            <Link to="/missions" className="btn btn-secondary">
              Ir a Mis mundos
            </Link>
          </div>
        </section>
      </AppShell>
    )
  }

  const title = legacySubject?.title ?? curriculumSubject?.title ?? 'Mundo'
  const shortTitle = legacySubject?.shortLabel ?? curriculumSubject?.shortTitle ?? title
  const description = legacySubject?.description ?? curriculumSubject?.description ?? ''
  const accent = legacySubject?.accent ?? curriculumSubject?.legacyHubId ?? 'mates'
  const iconId = (legacySubject?.id ?? curriculumSubject?.legacyHubId ?? 'mates') as SubjectId
  const preparedBlocks = curriculumSubject
    ? blocksForSubject(curriculumSubject.id).filter((b) => b.status !== 'hidden')
    : []

  return (
    <AppShell title={title} shortTitle={shortTitle} showBack>
      <section className="subject-preview" aria-labelledby="subject-preview-title">
        <div className={`subject-preview__panel subject-preview__panel--${accent}`}>
          <div className="subject-preview__icon">
            <SubjectIcon id={iconId} />
          </div>
          <p className="coming-soon__badge">Entrenamiento</p>
          <p id="subject-preview-title" className="coming-soon__title">
            {title}
          </p>
          <p className="coming-soon__body">{description}</p>
          {preparedBlocks.length > 0 ? (
            <ul className="subject-preview__blocks">
              {preparedBlocks.map((block) => (
                <li key={block.id}>
                  <strong>{block.title}</strong>
                  <span>
                    {block.status === 'active' ? ' · disponible' : ' · pronto'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="coming-soon__body">{comingSoonCopy.subject.body}</p>
          )}
          <div className="subject-preview__actions">
            <Link to="/missions" className="btn btn-secondary">
              Volver a Mis mundos
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
