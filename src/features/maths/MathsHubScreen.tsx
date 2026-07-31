import { AppShell } from '@/components/AppShell'
import { WorldLevelMap } from '@/components/world/WorldLevelMap'
import type { MapSlot, WorldStation } from '@/components/world/types'
import { blocksForSubject, getSubject } from '@/curriculum'
import {
  hubGuideTip,
  hubHasWeakZones,
  resolveHubZoneStatus,
  type HubZoneId,
} from '@/curriculum/hubRecommendations'
import { useProgress } from '@/progress/ProgressContext'

const MATH_MARKS = {
  'multiplication-tables': 'tables',
  calculation: 'calc',
  problems: 'problems',
  'clocks-hours': 'clocks',
} as const

const MATH_SLOTS: Record<string, MapSlot> = {
  'multiplication-tables': 'start',
  calculation: 'mid-high',
  problems: 'mid-low',
  'clocks-hours': 'end',
}

const MATH_SHORT_DESC: Record<string, string> = {
  'multiplication-tables': 'Tablas del 2 al 9',
  calculation: 'Piensa rápido',
  problems: 'Retos con números',
  'clocks-hours': 'Leer la hora',
}

const MATH_ZONES: HubZoneId[] = ['tables', 'calc', 'money', 'clocks']

function zoneForMathBlock(blockId: string): HubZoneId | null {
  if (blockId === 'multiplication-tables') return 'tables'
  if (blockId === 'calculation') return 'calc'
  if (blockId === 'problems') return 'money'
  if (blockId === 'clocks-hours') return 'clocks'
  return null
}

export function MathsHubScreen() {
  const { progress } = useProgress()
  const mathsBlocks = blocksForSubject('maths')
  const anyWeak = hubHasWeakZones(progress, MATH_ZONES)

  const stations: WorldStation[] = mathsBlocks.map((block) => {
    const mark = MATH_MARKS[block.id as keyof typeof MATH_MARKS] ?? 'calc'
    const mapSlot = MATH_SLOTS[block.id] ?? 'end'
    const short = MATH_SHORT_DESC[block.id] ?? block.description
    const zone = zoneForMathBlock(block.id)

    if (block.id === 'multiplication-tables' && block.status === 'active' && zone) {
      return {
        id: block.id,
        title: block.title,
        description: short,
        status: resolveHubZoneStatus(progress, zone, {
          playable: true,
          isStarter: true,
          anyWeakInHub: anyWeak,
        }),
        mark,
        mapSlot,
        href: '/missions/mates/tables',
        ctaLabel: 'JUGAR TABLAS',
      }
    }

    if (block.id === 'clocks-hours' && block.status === 'active' && zone) {
      return {
        id: block.id,
        title: block.title,
        description: short,
        status: resolveHubZoneStatus(progress, zone, {
          playable: true,
          anyWeakInHub: anyWeak,
        }),
        mark,
        mapSlot,
        href: '/missions/mates/clocks',
        ctaLabel: 'JUGAR HORAS',
      }
    }

    if (block.id === 'calculation' && block.status === 'active' && zone) {
      return {
        id: block.id,
        title: block.title,
        description: short,
        status: resolveHubZoneStatus(progress, zone, {
          playable: true,
          anyWeakInHub: anyWeak,
        }),
        mark,
        mapSlot,
        href: '/missions/mates/calc',
        ctaLabel: 'JUGAR CÁLCULO',
      }
    }

    if (block.id === 'problems' && zone) {
      return {
        id: 'money-euros',
        title: 'Dinero',
        description: 'Euros, cambio y monedas',
        status: resolveHubZoneStatus(progress, zone, {
          playable: true,
          anyWeakInHub: anyWeak,
        }),
        mark: 'money',
        mapSlot,
        href: '/missions/mates/money',
        ctaLabel: 'JUGAR DINERO',
      }
    }

    return {
      id: block.id,
      title: block.title,
      description: short,
      status: 'coming-soon',
      mark,
      mapSlot,
    }
  })

  const maths = getSubject('maths')
  const guideTip = hubGuideTip({
    hasRecommended: stations.some((s) => s.status === 'recommended'),
    hasWeak: anyWeak,
  })

  return (
    <AppShell
      title={maths?.title ?? 'Matemáticas'}
      shortTitle={maths?.shortTitle ?? 'Mates'}
      showBack
    >
      <WorldLevelMap
        theme="maths"
        guideTip={guideTip}
        stations={stations}
      />
    </AppShell>
  )
}
