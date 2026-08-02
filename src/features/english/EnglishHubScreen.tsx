import { AppShell } from '@/components/AppShell'
import { WorldLevelMap } from '@/components/world/WorldLevelMap'
import type { MapSlot, WorldStation, WorldZoneMark } from '@/components/world/types'
import { getSubject } from '@/curriculum'
import {
  ENGLISH_HUB_PACK_IDS,
  ENGLISH_PACK_LABELS,
  type EnglishHubPackId,
} from '@/feinetas/englishRegistry'

const PACK_MARK: Record<EnglishHubPackId, WorldZoneMark> = {
  'ingles-school': 'words',
  'ingles-family': 'phrases',
}

const PACK_SLOT: Record<EnglishHubPackId, MapSlot> = {
  'ingles-school': 'start',
  'ingles-family': 'end',
}

const PACK_SHORT: Record<EnglishHubPackId, string> = {
  'ingles-school': 'Cosas del cole · repaso 3.º',
  'ingles-family': 'La familia · repaso 3.º',
}

/** Hub de packs de repaso 3.º (Colours & Numbers aparcado). */
export function EnglishHubScreen() {
  const english = getSubject('english')
  const stations: WorldStation[] = ENGLISH_HUB_PACK_IDS.map((id) => ({
    id,
    title: ENGLISH_PACK_LABELS[id],
    description: PACK_SHORT[id],
    status: 'available',
    mark: PACK_MARK[id],
    mapSlot: PACK_SLOT[id],
    href: `/missions/english/${id}`,
    ctaLabel: 'ELEGIR MODO',
  }))

  return (
    <AppShell
      title={english?.title ?? 'Inglés'}
      shortTitle={english?.shortTitle ?? 'Inglés'}
      showBack
      backTo="/missions"
    >
      <WorldLevelMap
        theme="english"
        guideTip="Elige Colegio o Familia y luego el juego"
        stations={stations}
      />
    </AppShell>
  )
}
