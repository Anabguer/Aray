import { Link } from 'react-router-dom'
import { SubjectIcon } from '@/components/ZoneIcons'
import type { SubjectPreview } from '@/data/types'

export function SubjectCard({ subject }: { subject: SubjectPreview }) {
  const path = subject.id === 'mates' ? '/missions/mates' : `/missions/${subject.id}`
  const isPlayable = subject.id === 'mates'
  const progressPct = isPlayable ? 28 : 0

  return (
    <Link
      to={path}
      className={`subject-card subject-card--${subject.accent} subject-card--hub`}
      aria-label={isPlayable ? subject.title : `${subject.title}: vista previa`}
    >
      <SubjectIcon id={subject.id} />
      <span className="subject-card__title">{subject.title}</span>
      <span className="subject-card__desc">{subject.description}</span>
      <span
        className="subject-card__progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPct}
        aria-label={isPlayable ? `Progreso aproximado ${progressPct}%` : 'Sin progreso aún'}
      >
        <span style={{ width: `${Math.max(progressPct, isPlayable ? 8 : 0)}%` }} />
      </span>
      <span className="subject-card__badge">{isPlayable ? 'Jugar' : 'Vista previa'}</span>
    </Link>
  )
}
