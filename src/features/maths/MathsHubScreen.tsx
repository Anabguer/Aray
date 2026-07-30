import { AppShell } from '@/components/AppShell'
import { SubjectIcon } from '@/components/ZoneIcons'
import { WorldLevelMap } from '@/components/world/WorldLevelMap'
import type { MapSlot, WorldStation } from '@/components/world/types'
import { blocksForSubject, getSubject } from '@/curriculum'

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
  calculation: 'Sumas, restas y agilidad',
  problems: 'Retos con números',
  'clocks-hours': 'Leer la hora',
}

export function MathsHubScreen() {
  const mathsBlocks = blocksForSubject('maths')

  const stations: WorldStation[] = mathsBlocks.map((block) => {
    const isLive = block.id === 'multiplication-tables' && block.status === 'active'
    const mark = MATH_MARKS[block.id as keyof typeof MATH_MARKS] ?? 'calc'
    const mapSlot = MATH_SLOTS[block.id] ?? 'end'

    if (isLive) {
      return {
        id: block.id,
        title: block.title,
        description: MATH_SHORT_DESC[block.id] ?? block.description,
        status: 'recommended',
        mark,
        mapSlot,
        href: '/missions/mates/tables',
        ctaLabel: 'JUGAR TABLAS',
      }
    }

    return {
      id: block.id,
      title: block.title,
      description: MATH_SHORT_DESC[block.id] ?? block.description,
      status: 'coming-soon',
      mark,
      mapSlot,
    }
  })

  const maths = getSubject('maths')

  return (
    <AppShell
      title={maths?.title ?? 'Matemáticas'}
      shortTitle={maths?.shortTitle ?? 'Mates'}
      showBack
    >
      <WorldLevelMap
        theme="maths"
        title="Mundo de Matemáticas"
        tagline="Supera zonas y domina sus retos"
        icon={<SubjectIcon id="mates" />}
        guideTip="Empieza por aquí"
        stations={stations}
      />
    </AppShell>
  )
}
