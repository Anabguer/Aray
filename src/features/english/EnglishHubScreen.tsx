import { AppShell } from '@/components/AppShell'
import { WorldLevelMap } from '@/components/world/WorldLevelMap'
import type { MapSlot, WorldStation, WorldZoneMark } from '@/components/world/types'
import { blocksForSubject, getSubject } from '@/curriculum'
import {
  ENGLISH_STATION_BLURBS,
  ENGLISH_STATION_IDS,
  type EnglishStationId,
} from '@/feinetas/englishRegistry'

const MARKS: Record<EnglishStationId, WorldZoneMark> = {
  vocabulary: 'words',
  grammar: 'spelling',
  phrases: 'phrases',
}

const SLOTS: Record<EnglishStationId, MapSlot> = {
  vocabulary: 'start',
  grammar: 'mid-high',
  phrases: 'end',
}

const CTAS: Record<EnglishStationId, string> = {
  vocabulary: 'VOCABULARIO',
  grammar: 'GRAMÁTICA',
  phrases: 'FRASES',
}

/**
 * Hub de Inglés: 3 estaciones genéricas (como Lengua/Mates).
 * Packs internos en /missions/english/:stationId
 */
export function EnglishHubScreen() {
  const english = getSubject('english')
  const englishBlocks = blocksForSubject('english')

  const stations: WorldStation[] = ENGLISH_STATION_IDS.map((id) => {
    const block = englishBlocks.find((b) => b.id === id)
    const active = block?.status === 'active'
    return {
      id,
      title: block?.title ?? id,
      description: ENGLISH_STATION_BLURBS[id],
      status: active ? 'available' : 'coming-soon',
      mark: MARKS[id],
      mapSlot: SLOTS[id],
      ...(active
        ? {
            href: `/missions/english/${id}`,
            ctaLabel: CTAS[id],
          }
        : {}),
    }
  })

  return (
    <AppShell
      title={english?.title ?? 'Inglés'}
      shortTitle={english?.shortTitle ?? 'Inglés'}
      showBack
      backTo="/missions"
    >
      <WorldLevelMap
        theme="english"
        guideTip="Elige Vocabulario, Gramática o Frases"
        stations={stations}
      />
    </AppShell>
  )
}
