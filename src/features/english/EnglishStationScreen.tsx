import { Navigate, useParams } from 'react-router-dom'
import type { ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { StageSelect, StageSlot } from '@/components/stage/StageSelect'
import {
  ENGLISH_PACK_LABELS,
  ENGLISH_STATION_LABELS,
  isEnglishStationId,
  listEnglishStationPacks,
  type EnglishStationId,
} from '@/feinetas/englishRegistry'
import '../languages/spelling/spelling.css'

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

/** Lista packs de una estación (Vocabulario / Gramática / Frases). */
export function EnglishStationScreen() {
  const { stationId } = useParams<{ stationId: string }>()
  const valid = stationId != null && isEnglishStationId(stationId)

  if (!valid || !stationId) {
    return <Navigate to="/missions/english" replace />
  }

  const sid = stationId as EnglishStationId
  const packs = listEnglishStationPacks(sid)
  const title = ENGLISH_STATION_LABELS[sid]

  return (
    <AppShell
      title={title.toUpperCase()}
      shortTitle={title}
      showBack
      backTo="/missions/english"
    >
      <StageSelect
        heroes={packs.map((p, i) => {
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
              featured
              to={`/missions/english/pack/${id}`}
            />
          )
        })}
      />
    </AppShell>
  )
}
