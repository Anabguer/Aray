import { Link } from 'react-router-dom'
import { ZoneIcon } from '@/components/ZoneIcons'
import type { ZoneLink } from '@/data/types'

export function ZoneCard({ zone }: { zone: ZoneLink }) {
  const isActive = zone.status === 'active'
  const className = `zone-card zone-card--${zone.id} zone-card--hub${isActive ? '' : ' zone-card--soon'}`

  if (isActive) {
    return (
      <Link to={zone.path} className={className} aria-label={`${zone.title}. ${zone.description}`}>
        <ZoneIcon id={zone.id} />
        <span className="zone-card__title">{zone.title}</span>
        <span className="zone-card__desc">{zone.description}</span>
      </Link>
    )
  }

  return (
    <Link
      to={zone.path}
      className={className}
      aria-label={`${zone.title}: ${zone.description}. Próximamente`}
    >
      <ZoneIcon id={zone.id} />
      <span className="zone-card__title">{zone.title}</span>
      <span className="zone-card__desc">{zone.description}</span>
      <span className="zone-card__badge">Próximamente</span>
    </Link>
  )
}
