import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
    art: 'spell-correct',
    className: 'mode-poster--train',
    text: 'Comidas y preferencias',
  },
  'ingles-numbers': {
    art: 'spell-complete',
    className: 'mode-poster--challenge',
    text: 'Dígito ↔ palabra en inglés',
  },
  'ingles-there-is': {
    art: 'spell-intruder',
    className: 'mode-poster--learn',
    text: 'There is / are / was…',
  },
  'ingles-prepositions': {
    art: 'spell-missing',
    className: 'mode-poster--match',
    text: 'on · in · under · next to',
  },
  'ingles-abilities': {
    art: 'spell-mix',
    className: 'mode-poster--challenge',
    text: 'I can / I can’t + deportes',
  },
  'ingles-routines': {
    art: 'mis-fallos',
    className: 'mode-poster--train',
    text: 'Rutinas del día',
  },
}

/** Lista packs de una estación (Vocabulario / Gramática / Frases). */
export function EnglishStationScreen() {
  const { stationId } = useParams<{ stationId: string }>()
  const navigate = useNavigate()
  const valid = stationId != null && isEnglishStationId(stationId)

  useEffect(() => {
    if (!valid) navigate('/missions/english', { replace: true })
  }, [valid, navigate])

  if (!valid || !stationId) return null

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
        heroes={[]}
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
              to={`/missions/english/pack/${id}`}
            />
          )
        })}
        rosterCols={2}
      />
    </AppShell>
  )
}
