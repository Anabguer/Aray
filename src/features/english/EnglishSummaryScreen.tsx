import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ENGLISH_MODE_LABELS, useEnglishSession } from '@/english'
import {
  ENGLISH_PACK_LABELS,
  isEnglishHubPackId,
} from '@/feinetas/englishRegistry'
import { AppShell } from '@/components/AppShell'
import { RoundSummary } from '@/components/RoundSummary'
import { soundEngine } from '@/sound/soundEngine'

export function EnglishSummaryScreen() {
  const { packId } = useParams<{ packId: string }>()
  const navigate = useNavigate()
  const { lastSummary, setLastSummary } = useEnglishSession()
  const valid = packId != null && isEnglishHubPackId(packId)
  const modesPath = valid ? `/missions/english/${packId}` : '/missions/english'

  useEffect(() => {
    if (!valid) {
      navigate('/missions/english', { replace: true })
      return
    }
    if (!lastSummary || lastSummary.packId !== packId) {
      navigate(modesPath, { replace: true })
      return
    }
    soundEngine.play('points-earned')
  }, [lastSummary, navigate, packId, valid, modesPath])

  if (!valid || !lastSummary || lastSummary.packId !== packId) return null
  const s = lastSummary
  const pct = Math.round((s.correct / Math.max(1, s.total)) * 100)
  const hot = pct >= 80
  const packLabel = ENGLISH_PACK_LABELS[packId]

  return (
    <AppShell title="RESUMEN" shortTitle="Resumen" showBack backTo={modesPath}>
      <RoundSummary
        title={hot ? '¡Inglés on fire!' : 'Buen repaso'}
        meta={`${packLabel} · ${ENGLISH_MODE_LABELS[s.mode]}`}
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
              Otros modos
            </Link>
            <Link to="/missions/english" className="btn btn-ghost btn-block">
              Otros packs
            </Link>
          </>
        }
      />
    </AppShell>
  )
}
