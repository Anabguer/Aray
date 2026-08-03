import { AppShell } from '@/components/AppShell'
import { WorldLevelMap } from '@/components/world/WorldLevelMap'
import type { WorldStation } from '@/components/world/types'
import { getSubject } from '@/curriculum'
import { ENGLISH_HUB_PACK_IDS } from '@/feinetas/englishRegistry'

/**
 * Hub de Inglés. Sin packs jugables hasta categorizar fichas nuevas
 * (feinetas/Ingles/_inbox → categorías → JSON).
 */
export function EnglishHubScreen() {
  const english = getSubject('english')

  const stations: WorldStation[] =
    ENGLISH_HUB_PACK_IDS.length === 0
      ? [
          {
            id: 'english-prep',
            title: 'En preparación',
            description: 'Pronto: packs con tus fichas',
            status: 'coming-soon',
            mark: 'words',
            mapSlot: 'start',
          },
        ]
      : []

  return (
    <AppShell
      title={english?.title ?? 'Inglés'}
      shortTitle={english?.shortTitle ?? 'Inglés'}
      showBack
      backTo="/missions"
    >
      <WorldLevelMap
        theme="english"
        guideTip="Pronto: packs con tus fichas"
        stations={stations}
      />
    </AppShell>
  )
}
