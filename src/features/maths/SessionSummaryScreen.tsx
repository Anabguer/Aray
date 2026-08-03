import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { CrateReveal } from '@/components/CrateReveal'
import { DailyEnergyNote } from '@/components/DailyEnergyNote'
import { RoundSummary } from '@/components/RoundSummary'
import { challengeModeConfig } from '@/config/playConfig'
import { lumoMessages } from '@/config/lumoMessages'
import { newRecordMessage, noMissesMessage } from '@/config/messages'
import { energyCopy, rewardGoalConfig } from '@/config/rewardGoal'
import { formatFact } from '@/math/tables'
import { buildMissesQueue, buildTrainQueue } from '@/math/selector'
import { useAuth } from '@/auth/AuthContext'
import { usePlaySession } from '@/progress/PlayContext'
import { useProgress } from '@/progress/ProgressContext'
import { soundEngine } from '@/sound/soundEngine'

export function SessionSummaryScreen() {
  const navigate = useNavigate()
  const {
    progress,
    chooseCrate,
    openCrate,
    collectCrate,
  } = useProgress()
  const { lastResult, selection, setPendingQueue, setActiveMode, setLastResult, setSelection } =
    usePlaySession()
  const { tutorDisplayName } = useAuth()
  const tutorName = tutorDisplayName?.trim() || 'un adulto'
  const [crateNote, setCrateNote] = useState<string | null>(null)

  useEffect(() => {
    if (!lastResult) {
      navigate('/missions/mates/tables/modes', { replace: true })
      return
    }
    // La misión de tablas ya avanza en applySessionToProgress (slots = energía).
    if (lastResult.personalBest || lastResult.rewardPointsEarned > 0) {
      soundEngine.play('points-earned')
    }
  }, [lastResult, navigate])

  if (!lastResult) {
    return null
  }

  const result = lastResult
  const pending = progress.crates.pending

  const correctCount = result.answers.filter((a) => a.correct).length
  const wrongCount = result.answers.filter((a) => !a.correct).length
  const totalAnswered = result.answers.length
  const isChallenge = result.mode === 'challenge'

  const modeLabel =
    result.mode === 'challenge'
      ? 'Reto rápido'
      : result.mode === 'misses'
        ? 'Práctica de fallos'
        : result.mode === 'match'
          ? 'Empareja la tabla'
          : 'Entrena'

  const celebrate = Boolean(
    result.rewardGoalJustCompleted || result.personalBest || result.bestStreak >= 5,
  )
  const lumoState = result.rewardGoalJustCompleted || result.personalBest
    ? 'celebration'
    : result.rewardDailyComplete
      ? 'streak'
      : result.bestStreak >= 3
        ? 'correct'
        : 'idle'

  const title = result.personalBest
    ? '¡Nuevo récord!'
    : result.rewardGoalJustCompleted
      ? '¡Drop desbloqueado!'
      : isChallenge
        ? `${result.score} pts`
        : correctCount >= Math.max(1, totalAnswered - 1)
          ? '¡Buenas tablas!'
          : 'Ronda terminada'

  function repeat() {
    setLastResult(null)
    if (result.mode === 'challenge') {
      setActiveMode('challenge')
      navigate('/missions/mates/tables/challenge')
      return
    }
    if (result.mode === 'match') {
      setActiveMode('match')
      setSelection({ tables: result.tables.slice(0, 1), mix: false })
      navigate('/missions/mates/tables/match')
      return
    }
    setActiveMode(result.mode === 'misses' ? 'misses' : 'train')
    setPendingQueue(buildTrainQueue(selection.tables, progress))
    navigate('/missions/mates/tables/train')
  }

  function practiceMisses() {
    setLastResult(null)
    const { queue, usedFallbackMix } = buildMissesQueue(progress)
    setActiveMode(usedFallbackMix ? 'train' : 'misses')
    setPendingQueue(queue)
    navigate('/missions/mates/tables/train', { state: { fallbackMix: usedFallbackMix } })
  }

  const stats = [
    { value: correctCount, label: 'aciertos' },
    { value: wrongCount, label: 'fallos' },
    { value: result.bestStreak, label: 'mejor racha' },
    isChallenge && result.personalBest
      ? { value: '¡Nuevo!', label: 'récord' }
      : { value: totalAnswered, label: 'respondidas' },
  ]

  return (
    <AppShell
      title="Resumen"
      showBack
      backTo="/missions/mates/tables/modes"
    >
      {pending ? (
        <CrateReveal
          pending={pending}
          onChoose={chooseCrate}
          onOpen={openCrate}
          onCollect={() => {
            const note = collectCrate()
            setCrateNote(note)
          }}
        />
      ) : null}
      {crateNote ? (
        <p className="play-banner play-banner--info" role="status">
          {crateNote}
        </p>
      ) : null}

      <RoundSummary
        className="round-summary--tables"
        title={title}
        meta={
          <>
            {modeLabel}
            {result.personalBest ? ` · ${newRecordMessage}` : null}
            {result.rewardGoalJustCompleted
              ? ` · ${energyCopy.dropUnlockedFor(tutorName)}`
              : null}
          </>
        }
        lumoState={lumoState}
        celebrate={celebrate}
        stats={stats}
        note={
          <div className="summary-reward-note" role="status">
            <p>
              {isChallenge
                ? `Has conseguido ${result.xpEarned} XP — bonus Reto ×${challengeModeConfig.xpMultiplier} incluido`
                : `Has conseguido ${result.xpEarned} XP`}
            </p>
            {result.rewardPointsEarned > 0 ? (
              <p>{energyCopy.farmed(result.rewardPointsEarned)}</p>
            ) : result.rewardPointsRequested > 0 || result.rewardDailyComplete ? (
              <DailyEnergyNote compact />
            ) : (
              <p>Sin energía nueva en esta sesión.</p>
            )}
            <p>{energyCopy.today(result.rewardDailyPoints, rewardGoalConfig.dailyCap)}</p>
            <p>{energyCopy.total(result.rewardPointsTotal, rewardGoalConfig.targetPoints)}</p>
          </div>
        }
        extra={
          <div className="summary-misses">
            <h3 className="section-title">Para repasar</h3>
            {result.missedFacts.length === 0 ? (
              <p className="page-intro__lead">{noMissesMessage}</p>
            ) : (
              <>
                <p className="page-intro__lead">{lumoMessages.practiceMisses}</p>
                <ul className="miss-list">
                  {result.missedFacts.map((fact) => (
                    <li key={`${fact.a}x${fact.b}`}>
                      {formatFact(fact)} = {fact.product}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        }
        actions={
          <>
            <button type="button" className="btn btn-primary btn-block" onClick={repeat}>
              Repetir
            </button>
            <button type="button" className="btn btn-secondary btn-block" onClick={practiceMisses}>
              Practicar mis fallos
            </button>
            <Link to="/missions/mates/tables" className="btn btn-ghost btn-block">
              Volver a las tablas
            </Link>
          </>
        }
      />
    </AppShell>
  )
}
