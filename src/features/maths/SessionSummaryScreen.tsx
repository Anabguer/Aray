import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { CrateReveal } from '@/components/CrateReveal'
import { challengeModeConfig } from '@/config/playConfig'
import { lumoMessages } from '@/config/lumoMessages'
import { newRecordMessage, noMissesMessage } from '@/config/messages'
import { energyCopy, rewardGoalConfig } from '@/config/rewardGoal'
import { Lumo } from '@/lumo/Lumo'
import { formatFact } from '@/math/tables'
import { buildMissesQueue, buildTrainQueue } from '@/math/selector'
import { usePlaySession } from '@/progress/PlayContext'
import { useProgress } from '@/progress/ProgressContext'
import { soundEngine } from '@/sound/soundEngine'
import { useDailyMission } from '@/daily/DailyMissionContext'

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
  const { recordProgress } = useDailyMission()
  const [crateNote, setCrateNote] = useState<string | null>(null)

  useEffect(() => {
    if (!lastResult) {
      navigate('/missions/mates/tables/modes', { replace: true })
      return
    }
    const correct = lastResult.answers.filter((a) => a.correct).length
    if (correct > 0) recordProgress('tables', correct)
    if (lastResult.personalBest || lastResult.coinsEarned > 0 || lastResult.rewardPointsEarned > 0) {
      soundEngine.play('points-earned')
    }
  }, [lastResult, navigate, recordProgress])

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

  const lumoState = result.rewardGoalJustCompleted || result.personalBest
    ? 'celebration'
    : result.rewardDailyComplete
      ? 'streak'
      : result.bestStreak >= 3
        ? 'correct'
        : 'idle'

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

  return (
    <AppShell
      title="Resumen"
      showBack
      backTo="/missions/mates/tables/modes"
    >
      <section className="summary-screen">
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

        <div className="summary-hero">
          <Lumo state={lumoState} intensity={lumoState === 'celebration' ? 4 : 2} size="md" />
          <p className="summary-hero__label">{modeLabel}</p>
          <p className="summary-hero__score">
            {isChallenge ? `${result.score} pts` : `${correctCount} aciertos`}
          </p>
          {result.personalBest ? <p className="summary-hero__record">{newRecordMessage}</p> : null}
          {result.rewardGoalJustCompleted ? (
            <p className="summary-hero__record">{energyCopy.dropUnlocked}</p>
          ) : null}
        </div>

        <ul className="summary-stats">
          <li>
            <span>Aciertos</span>
            <strong>{correctCount}</strong>
          </li>
          <li>
            <span>Fallos</span>
            <strong>{wrongCount}</strong>
          </li>
          <li>
            <span>Mejor racha</span>
            <strong>{result.bestStreak}</strong>
          </li>
          {isChallenge && result.personalBest ? (
            <li>
              <span>Récord</span>
              <strong>¡Nuevo!</strong>
            </li>
          ) : (
            <li>
              <span>Respondidas</span>
              <strong>{totalAnswered}</strong>
            </li>
          )}
        </ul>

        <div className="summary-reward-note" role="status">
          <p>
            {isChallenge
              ? `Has conseguido ${result.xpEarned} XP — bonus Reto ×${challengeModeConfig.xpMultiplier} incluido`
              : `Has conseguido ${result.xpEarned} XP`}
          </p>
          {result.coinsEarned > 0 ? (
            <p>
              {isChallenge
                ? `Monedas +${result.coinsEarned} — bonus Reto ×${challengeModeConfig.coinMultiplier} incluido`
                : `Monedas +${result.coinsEarned}`}
            </p>
          ) : null}
          {result.rewardPointsEarned > 0 ? (
            <p>{energyCopy.farmed(result.rewardPointsEarned)}</p>
          ) : result.rewardPointsRequested > 0 ? (
            <p>Hoy ya está completa la carga diaria; XP, monedas y dominio siguen sumando.</p>
          ) : (
            <p>Sin energía nueva en esta sesión.</p>
          )}
          <p>{energyCopy.today(result.rewardDailyPoints, rewardGoalConfig.dailyCap)}</p>
          <p>{energyCopy.total(result.rewardPointsTotal, rewardGoalConfig.targetPoints)}</p>
        </div>

        <div className="summary-misses">
          <h2 className="section-title">Para repasar</h2>
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

        <div className="summary-actions">
          <button type="button" className="btn btn-primary btn-block" onClick={repeat}>
            Repetir
          </button>
          <button type="button" className="btn btn-secondary btn-block" onClick={practiceMisses}>
            Practicar mis fallos
          </button>
          <Link to="/missions/mates/tables" className="btn btn-ghost btn-block">
            Volver a las tablas
          </Link>
        </div>
      </section>
    </AppShell>
  )
}
