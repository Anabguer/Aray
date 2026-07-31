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

const LANG_MARKS = {
  alphabet: 'alphabet',
  writing: 'writing',
  comprehension: 'reading',
  spelling: 'spelling',
} as const

const LANG_SLOTS: Record<string, MapSlot> = {
  alphabet: 'start',
  spelling: 'mid-high',
  writing: 'mid-low',
  comprehension: 'end',
}

const LANG_SHORT: Record<string, string> = {
  alphabet: 'Letras A–Z y Ñ',
  writing: 'Escribir con claridad',
  comprehension: 'Entender textos',
  spelling: 'Repaso ortografía 3.º',
}

const LANG_ZONES: HubZoneId[] = ['alphabet', 'spelling']

export function LanguagesHubScreen() {
  const { progress } = useProgress()
  const langBlocks = blocksForSubject('languages')
  const anyWeak = hubHasWeakZones(progress, LANG_ZONES)

  const stations: WorldStation[] = langBlocks.map((block) => {
    const mark = LANG_MARKS[block.id as keyof typeof LANG_MARKS] ?? 'alphabet'
    const mapSlot = LANG_SLOTS[block.id] ?? 'end'
    const short = LANG_SHORT[block.id] ?? block.description

    if (block.id === 'alphabet' && block.status === 'active') {
      return {
        id: block.id,
        title: block.title,
        description: short,
        status: resolveHubZoneStatus(progress, 'alphabet', {
          playable: true,
          isStarter: true,
          anyWeakInHub: anyWeak,
        }),
        mark,
        mapSlot,
        href: '/missions/languages/alphabet',
        ctaLabel: 'JUGAR ABC',
      }
    }

    if (block.id === 'spelling' && block.status === 'active') {
      return {
        id: block.id,
        title: block.title,
        description: short,
        status: resolveHubZoneStatus(progress, 'spelling', {
          playable: true,
          anyWeakInHub: anyWeak,
        }),
        mark,
        mapSlot,
        href: '/missions/languages/spelling',
        ctaLabel: 'JUGAR ORTOGRAFÍA',
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

  const languages = getSubject('languages')
  const guideTip = hubGuideTip({
    hasRecommended: stations.some((s) => s.status === 'recommended'),
    hasWeak: anyWeak,
  })

  return (
    <AppShell
      title={languages?.title ?? 'Lenguas'}
      shortTitle={languages?.shortTitle ?? 'Lenguas'}
      showBack
    >
      <WorldLevelMap
        theme="languages"
        guideTip={guideTip}
        stations={stations}
      />
    </AppShell>
  )
}
