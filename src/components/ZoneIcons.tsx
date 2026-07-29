import { ArayHubIcon } from '@/components/ArayHubIcon'
import type { HubIconId } from '@/assets/icons/hub'
import type { SubjectId, ZoneId } from '@/data/types'

const zoneHubIcons: Partial<Record<ZoneId, HubIconId>> = {
  missions: 'misiones',
  collection: 'coleccion',
}

const subjectHubIcons: Record<SubjectId, HubIconId> = {
  mates: 'matematicas',
  catala: 'catalan',
  castellano: 'castellano',
  angles: 'ingles',
  medi: 'medi',
}

export function ZoneIcon({ id }: { id: ZoneId }) {
  const hubId = zoneHubIcons[id]
  if (!hubId) {
    return <span className="icon-wrap icon-wrap--empty" aria-hidden="true" />
  }
  return (
    <span className="icon-wrap icon-wrap--hub">
      <ArayHubIcon id={hubId} className="icon-wrap__img" />
    </span>
  )
}

export function SubjectIcon({ id }: { id: SubjectId }) {
  return (
    <span className="icon-wrap icon-wrap--hub icon-wrap--subject">
      <ArayHubIcon id={subjectHubIcons[id]} className="icon-wrap__img" />
    </span>
  )
}
