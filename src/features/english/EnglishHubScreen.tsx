import { useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import { WorldLevelMap } from '@/components/world/WorldLevelMap'
import type { MapSlot, WorldStation, WorldZoneMark } from '@/components/world/types'
import { blocksForSubject, getSubject } from '@/curriculum'
import type { ModeArtId } from '@/assets/modes'
import { EnglishModeSelectView } from '@/features/english/EnglishModeSelectScreen'
import {
  ENGLISH_PACK_LABELS,
  ENGLISH_STATION_BLURBS,
  ENGLISH_STATION_IDS,
  ENGLISH_STATION_LABELS,
  listEnglishStationPacks,
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

const CTAS: Record<EnglishStationId, string> = {
  vocabulary: 'ABRIR',
  grammar: 'ABRIR',
  phrases: 'ABRIR',
}

const PACK_ART: Record<string, { art: ModeArtId; className: string; text: string }> = {
  'ingles-food': {
    art: 'english-food',
    className: 'mode-poster--train',
    text: 'Comidas y preferencias',
  },
  'ingles-numbers': {
    art: 'english-numbers',
    className: 'mode-poster--challenge',
    text: 'Dígito ↔ palabra en inglés',
  },
  'ingles-places': {
    art: 'english-places',
    className: 'mode-poster--learn',
    text: 'Campamento y paisajes',
  },
  'ingles-weather': {
    art: 'english-weather',
    className: 'mode-poster--match',
    text: "It's hot / sunny / raining…",
  },
  'ingles-characters': {
    art: 'english-characters',
    className: 'mode-poster--challenge',
    text: 'Personajes, ropa y adjetivos',
  },
  'ingles-transport': {
    art: 'english-transport',
    className: 'mode-poster--train',
    text: 'Cómo voy al cole',
  },
  'ingles-money': {
    art: 'english-money',
    className: 'mode-poster--learn',
    text: 'How much is…? euros',
  },
  'ingles-there-is': {
    art: 'english-there-is',
    className: 'mode-poster--learn',
    text: 'There is / are / was…',
  },
  'ingles-prepositions': {
    art: 'english-prepositions',
    className: 'mode-poster--match',
    text: 'on · in · under · next to',
  },
  'ingles-possessives': {
    art: 'english-possessives',
    className: 'mode-poster--challenge',
    text: "'s · his · her",
  },
  'ingles-present-simple': {
    art: 'spell-mix',
    className: 'mode-poster--train',
    text: 'Presente + Do/Does',
  },
  'ingles-present-continuous': {
    art: 'spell-picture',
    className: 'mode-poster--learn',
    text: 'Is/Are … -ing',
  },
  'ingles-time': {
    art: 'clock-match',
    className: 'mode-poster--challenge',
    text: 'What time is it?',
  },
  'ingles-abilities': {
    art: 'english-abilities',
    className: 'mode-poster--challenge',
    text: 'I can / I can’t + deportes',
  },
  'ingles-routines': {
    art: 'english-routines',
    className: 'mode-poster--train',
    text: 'Rutinas del día',
  },
  'ingles-phrases': {
    art: 'words-monta-frase',
    className: 'mode-poster--match',
    text: 'Montar oraciones',
  },
}

/**
 * Hub de Inglés: 3 estaciones.
 * Estación y pack = estado local (sin cambiar de ruta) para evitar
 * el bug “URL cambia y la pantalla no”. Solo el modo de juego navega.
 */
export function EnglishHubScreen() {
  const english = getSubject('english')
  const englishBlocks = blocksForSubject('english')
  const [openStation, setOpenStation] = useState<EnglishStationId | null>(null)
  const [openPack, setOpenPack] = useState<string | null>(null)

  if (openPack) {
    return (
      <EnglishModeSelectView
        packId={openPack}
        onBack={() => setOpenPack(null)}
      />
    )
  }

  if (openStation) {
    const packs = listEnglishStationPacks(openStation)
    const title = ENGLISH_STATION_LABELS[openStation]
    return (
      <AppShell
        title={title.toUpperCase()}
        shortTitle={title}
        showBack
        onBack={() => setOpenStation(null)}
      >
        <StageSelect
          kicker="Elige pack"
          title={title}
          heroes={[]}
          divider="Packs"
          roster={packs.map((p, i) => {
            const id = p.pack.id
            const meta = PACK_ART[id] ?? {
              art: 'spell-correct' as ModeArtId,
              className: 'mode-poster--train',
              text: p.pack.title,
            }
            return (
              <StageSlot
                key={id}
                art={meta.art}
                title={(ENGLISH_PACK_LABELS[id] ?? p.pack.title).toUpperCase()}
                text={meta.text}
                className={meta.className}
                tag={String(i + 1).padStart(2, '0')}
                onClick={() => setOpenPack(id)}
              />
            )
          })}
          rosterCols={2}
        />
      </AppShell>
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
      ...(active ? { ctaLabel: CTAS[id] } : {}),
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
        guideTip="Toca una estación para ver sus packs"
        stations={stations}
        onStationOpen={(id) => {
          if (isStationId(id)) setOpenStation(id)
        }}
      />
    </AppShell>
  )
}

function isStationId(id: string): id is EnglishStationId {
  return (ENGLISH_STATION_IDS as readonly string[]).includes(id)
}
