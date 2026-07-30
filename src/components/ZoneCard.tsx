import { Link } from 'react-router-dom'
import { IconChevronRight } from '@/components/Icons'
import { ZoneIcon } from '@/components/ZoneIcons'
import type { ZoneLink } from '@/data/types'

export function ZoneCard({ zone }: { zone: ZoneLink }) {
  const isActive = zone.status === 'active'
  const className = `zone-card zone-card--${zone.id} zone-card--hub${isActive ? '' : ' zone-card--soon'}`

  return (
    <Link
      to={zone.path}
      className={className}
      aria-label={
        isActive
          ? `${zone.title}. ${zone.description}`
          : `${zone.title}: ${zone.description}. Próximamente`
      }
    >
      <span className="zone-card__art" aria-hidden="true">
        <ZoneIcon id={zone.id} />
      </span>
      <span className="zone-card__copy">
        <span className="zone-card__title">{zone.title}</span>
        <span className="zone-card__desc">{zone.description}</span>
        {!isActive ? <span className="zone-card__badge">Próximamente</span> : null}
      </span>
      <IconChevronRight className="zone-card__chevron" aria-hidden />
    </Link>
  )
}
