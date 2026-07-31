import { AppShell } from '@/components/AppShell'
import { SubjectIcon } from '@/components/ZoneIcons'
import { WorldLevelMap } from '@/components/world/WorldLevelMap'
import type { MapSlot, WorldStation } from '@/components/world/types'
import { blocksForSubject, getSubject } from '@/curriculum'

const LANG_MARKS = {
  alphabet: 'alphabet',
  writing: 'writing',
  comprehension: 'reading',
  spelling: 'spelling',
} as const

const LANG_SLOTS: Record<string, MapSlot> = {
  alphabet: 'start',
  writing: 'mid-high',
  comprehension: 'mid-low',
  spelling: 'end',
}

const LANG_SHORT: Record<string, string> = {
  alphabet: 'Letras A–Z y Ñ',
  writing: 'Escribir con claridad',
  comprehension: 'Entender textos',
  spelling: 'Escribir bien',
}

export function LanguagesHubScreen() {
  const langBlocks = blocksForSubject('languages')

  const stations: WorldStation[] = langBlocks.map((block) => {
    const mark = LANG_MARKS[block.id as keyof typeof LANG_MARKS] ?? 'alphabet'
    const mapSlot = LANG_SLOTS[block.id] ?? 'end'
    const short = LANG_SHORT[block.id] ?? block.description

    if (block.id === 'alphabet' && block.status === 'active') {
      return {
        id: block.id,
        title: block.title,
        description: short,
        status: 'recommended',
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
        status: 'recommended',
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

  return (
    <AppShell
      title={languages?.title ?? 'Lenguas'}
      shortTitle={languages?.shortTitle ?? 'Lenguas'}
      showBack
    >
      <WorldLevelMap
        theme="languages"
        title="Mundo de Lenguas"
        tagline="Letras, palabras y práctica suave"
        icon={<SubjectIcon id="catala" />}
        guideTip="Empieza por el abecedario"
        stations={stations}
      />
    </AppShell>
  )
}
