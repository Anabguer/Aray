import { AppShell } from '@/components/AppShell'
import { WorldLevelMap } from '@/components/world/WorldLevelMap'
import type { MapSlot, WorldStation, WorldZoneMark } from '@/components/world/types'
import { getSubject } from '@/curriculum'
import {
  ENGLISH_PACK_IDS,
  ENGLISH_PACK_LABELS,
  type EnglishPackId,
} from '@/feinetas/englishRegistry'

const PACK_MARK: Record<EnglishPackId, WorldZoneMark> = {
  'ingles-colours-numbers': 'match',
  'ingles-school': 'words',
  'ingles-family': 'phrases',
}

const PACK_SLOT: Record<EnglishPackId, MapSlot> = {
  'ingles-colours-numbers': 'start',
  'ingles-school': 'mid-high',
  'ingles-family': 'end',
}

const PACK_SHORT: Record<EnglishPackId, string> = {
  'ingles-colours-numbers': 'Colores y números en inglés',
  'ingles-school': 'Cosas del cole',
  'ingles-family': 'La familia',
}

/** Hub de packs; un 4.º pack solo requiere registro + JSON. */
export function EnglishHubScreen() {
  const english = getSubject('english')
  const stations: WorldStation[] = ENGLISH_PACK_IDS.map((id) => ({
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
        guideTip="Elige un pack de palabras y luego el juego"
        stations={stations}
      />
    </AppShell>
  )
}
