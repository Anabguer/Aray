import { Link } from 'react-router-dom'
import { IconChevronRight } from '@/components/Icons'
import { ZoneIcon } from '@/components/ZoneIcons'
import type { ZoneLink } from '@/data/types'
import { countClaimableAchievements } from '@/achievements/catalog'
import { useProgress } from '@/progress/ProgressContext'

export function ZoneCard({ zone }: { zone: ZoneLink }) {
  const isActive = zone.status === 'active'
  const { progress } = useProgress()
  const claimable =
    zone.id === 'collection' && isActive ? countClaimableAchievements(progress) : 0
  const className = `zone-card zone-card--${zone.id} zone-card--hub${isActive ? '' : ' zone-card--soon'}`

  return (
    <Link
      to={zone.path}
      className={className}
      aria-label={
        isActive
          ? `${zone.title}. ${zone.description}${claimable > 0 ? `. ${claimable} premios por recoger` : ''}`
          : `${zone.title}: ${zone.description}. Próximamente`
      }
    >
      <span className="zone-card__art" aria-hidden="true">
        <ZoneIcon id={zone.id} />
        {claimable > 0 ? (
          <span className="zone-card__notify" aria-hidden="true">
            {claimable > 9 ? '9+' : claimable}
          </span>
        ) : null}
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
