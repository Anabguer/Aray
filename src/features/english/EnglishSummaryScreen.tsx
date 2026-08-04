import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ENGLISH_MODE_LABELS, useEnglishSession } from '@/english'
import {
  ENGLISH_PACK_LABELS,
  ENGLISH_STATION_LABELS,
  isEnglishHubPackId,
  isEnglishStationId,
  stationForEnglishPack,
} from '@/feinetas/englishRegistry'
import { AppShell } from '@/components/AppShell'
import { RoundSummary } from '@/components/RoundSummary'
import { soundEngine } from '@/sound/soundEngine'

export function EnglishSummaryScreen() {
  const { packId, stationId } = useParams<{
    packId?: string
    stationId?: string
  }>()
  const navigate = useNavigate()
  const { lastSummary, setLastSummary } = useEnglishSession()

  const isStation =
    stationId != null && isEnglishStationId(stationId) && !packId
  const isPack = packId != null && isEnglishHubPackId(packId)
  const valid = isStation || isPack

  const modesPath = isStation
    ? `/missions/english/${stationId}`
    : isPack
      ? `/missions/english/pack/${packId}`
      : '/missions/english'

  const hubPath = isStation
    ? '/missions/english'
    : (() => {
        const station = isPack && packId ? stationForEnglishPack(packId) : null
        return station ? `/missions/english/${station}` : '/missions/english'
      })()

  const summaryMatches =
    lastSummary != null &&
    ((isStation && lastSummary.stationId === stationId) ||
      (isPack && lastSummary.packId === packId))

  useEffect(() => {
    if (!valid) {
      navigate('/missions/english', { replace: true })
      return
    }
    if (!summaryMatches) {
      navigate(modesPath, { replace: true })
      return
    }
    soundEngine.play('points-earned')
  }, [summaryMatches, navigate, valid, modesPath])

  if (!valid || !lastSummary || !summaryMatches) return null
  const s = lastSummary
  const pct = Math.round((s.correct / Math.max(1, s.total)) * 100)
  const hot = pct >= 80
  const scopeLabel = isStation
    ? ENGLISH_STATION_LABELS[stationId!]
    : ENGLISH_PACK_LABELS[packId!]

  return (
    <AppShell title="RESUMEN" shortTitle="Resumen" showBack backTo={modesPath}>
      <RoundSummary
        title={hot ? '¡Inglés on fire!' : 'Buen repaso'}
        meta={`${scopeLabel} · ${ENGLISH_MODE_LABELS[s.mode]}`}
        lumoState={hot ? 'celebration' : 'correct'}
        celebrate={hot}
        stats={[
          { value: s.correct, label: 'aciertos' },
          { value: s.bestStreak, label: 'racha' },
          { value: `${pct}%`, label: 'ronda' },
        ]}
        actions={
          <>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => {
                const mode = s.mode
                setLastSummary(null)
                navigate(`${modesPath}/${mode}`)
              }}
            >
              Otra ronda
            </button>
            <Link to={modesPath} className="btn btn-ghost btn-block">
              Mis fallos / Random
            </Link>
            <Link to={hubPath} className="btn btn-ghost btn-block">
              {isStation ? 'Estaciones' : 'Volver a la estación'}
            </Link>
            {!isStation ? (
              <Link to="/missions/english" className="btn btn-ghost btn-block">
                Estaciones
              </Link>
            ) : null}
          </>
        }
      />
    </AppShell>
  )
}
