import { useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { WorldLevelMap } from '@/components/world/WorldLevelMap'
import type { MapSlot, WorldStation, WorldZoneMark } from '@/components/world/types'
import { blocksForSubject, getSubject } from '@/curriculum'
import { EnglishStationModesView } from '@/features/english/EnglishStationModesView'
import {
  ENGLISH_STATION_BLURBS,
  ENGLISH_STATION_IDS,
  ENGLISH_STATION_LABELS,
  type EnglishStationId,
} from '@/feinetas/englishRegistry'
import '../languages/spelling/spelling.css'

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

/**
 * Hub: 3 estaciones. Dentro = Mis fallos + Random (sin lista de packs).
 */
export function EnglishHubScreen() {
  const english = getSubject('english')
  const englishBlocks = blocksForSubject('english')
  const [openStation, setOpenStation] = useState<EnglishStationId | null>(null)

  if (openStation) {
    return (
      <EnglishStationModesView
        stationId={openStation}
        onBack={() => setOpenStation(null)}
      />
    )
  }

  const stations: WorldStation[] = ENGLISH_STATION_IDS.map((id) => {
    const block = englishBlocks.find((b) => b.id === id)
    const active = block?.status === 'active'
    return {
      id,
      title: block?.title ?? ENGLISH_STATION_LABELS[id],
      description: ENGLISH_STATION_BLURBS[id],
      status: active ? 'available' : 'coming-soon',
      mark: MARKS[id],
      mapSlot: SLOTS[id],
      ...(active ? { ctaLabel: 'ABRIR' } : {}),
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
        guideTip="Toca una estación · Mis fallos o Random"
        stations={stations}
        onStationOpen={(id) => {
          if ((ENGLISH_STATION_IDS as readonly string[]).includes(id)) {
            setOpenStation(id as EnglishStationId)
          }
        }}
      />
    </AppShell>
  )
}
