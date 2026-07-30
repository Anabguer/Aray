import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import {
  AnswerGrid,
  FactPrompt,
  FeedbackBanner,
  MuteToggle,
  useFlash,
  useKeyboardAnswers,
} from '@/components/quiz/QuizWidgets'
import { AnswerBurst, StreakBadge, XpFlyLabel } from '@/feedback/AnswerFx'
import { SessionXpBar } from '@/feedback/SessionXpBar'
import {
  isPerfectSession,
  sessionLeveledUp,
  unlockLabelAfterSession,
} from '@/feedback/sessionOutcome'
import {
  LevelUpCelebration,
  TableCompleteCelebration,
  type TableCompleteInfo,
} from '@/feedback/TableCompleteCelebration'
import { pickWrongRetryMessage, sessionXpEarned, xpDeltaForAnswer } from '@/feedback/xpPreview'
import { energyCopy, trainSessionMeta } from '@/config/rewardGoal'
import { praiseMessages, streakMessages } from '@/config/messages'
import { Lumo } from '@/lumo/Lumo'
import { useLumoController } from '@/lumo/useLumoController'
import type { QuestionCard, SessionAnswer } from '@/math/types'
import { formatFact } from '@/math/tables'
import { usePlaySession } from '@/progress/PlayContext'
import { useProgress } from '@/progress/ProgressContext'
import { newId } from '@/progress/repository'
import { previewSessionLoad } from '@/reward/engine'
import { soundEngine } from '@/sound/soundEngine'

function pickPraise(streak: number): string {
  if (streak >= 5) return energyCopy.streakOnFire
  if (streakMessages[streak]) return streakMessages[streak]
  return praiseMessages[streak % praiseMessages.length]
}

export function TrainScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const fallbackMix = Boolean((location.state as { fallbackMix?: boolean } | null)?.fallbackMix)
  const { progress, applySession, setSoundMuted } = useProgress()
  const { selection, pendingQueue, setPendingQueue, setLastResult, activeMode } = usePlaySession()
  const lumo = useLumoController('thinking')
  const sessionIdRef = useRef(newId('train'))
  const openedRef = useRef(false)

  const initialQueue = useMemo(() => pendingQueue ?? [], [pendingQueue])
  const [queue] = useState<QuestionCard[]>(initialQueue)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<SessionAnswer[]>([])
  const [firstTryStreak, setFirstTryStreak] = useState(0)
  const [failedThisQuestion, setFailedThisQuestion] = useState(false)
  const [recordedMiss, setRecordedMiss] = useState(false)
  const [locked, setLocked] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealCorrect, setRevealCorrect] = useState(false)
  const [showEquality, setShowEquality] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'bad' | 'info'; message: string } | null>(
    null,
  )
  const [burstKey, setBurstKey] = useState(0)
  const [flyKey, setFlyKey] = useState(0)
  const [flyAmount, setFlyAmount] = useState(0)
  const [barHighlight, setBarHighlight] = useState(0)
  const [pendingXp, setPendingXp] = useState(0)
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null)
  const [celebration, setCelebration] = useState<TableCompleteInfo | null>(null)
  const flash = useFlash()
  const maxLoad = previewSessionLoad(progress, trainSessionMeta.maxRewardFromItems)

  useEffect(() => {
    if (!pendingQueue || pendingQueue.length === 0) {
      navigate('/missions/mates/tables/modes', { replace: true })
    }
  }, [pendingQueue, navigate])

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    soundEngine.unlock()
    soundEngine.play('activity-open')
  }, [])

  const current = queue[index]
  const solvedCount = answers.filter((a) => a.correct).length
  const liveTotalXp = progress.xp + pendingXp
  const mode = activeMode === 'misses' ? 'misses' : 'train'

  const finish = useCallback(
    (finalAnswers: SessionAnswer[]) => {
      const progressBefore = progress
      const result = applySession({
        mode,
        tables: selection.tables,
        answers: finalAnswers,
        score: finalAnswers.filter((a) => a.correct && (a.firstTry ?? true)).length,
        bestStreak: 0,
        sessionId: sessionIdRef.current,
      })
      flushSync(() => {
        setLastResult(result)
        setPendingQueue(null)
      })

      const perfect = isPerfectSession(finalAnswers)
      const { leveledUp, newLevel } = sessionLeveledUp(progressBefore.xp, result.xpEarned)
      const unlockLabel = unlockLabelAfterSession(
        progressBefore,
        selection.tables,
        finalAnswers,
        result,
      )
      const tableNumber = selection.tables.length === 1 ? selection.tables[0] : null

      soundEngine.play(perfect ? 'perfect-complete' : 'activity-complete')

      setPendingXp(0)
      setCelebration({
        perfect,
        tableNumber,
        xpEarned: result.xpEarned,
        totalXpAfter: progressBefore.xp + result.xpEarned,
        unlockLabel,
        leveledUp,
        newLevel,
      })
    },
    [applySession, mode, progress, selection.tables, setLastResult, setPendingQueue],
  )

  const goNext = useCallback(
    (finalAnswers: SessionAnswer[]) => {
      const nextIndex = index + 1
      if (nextIndex >= queue.length || finalAnswers.filter((a) => a.correct).length >= 10) {
        finish(finalAnswers)
        return
      }
      setIndex(nextIndex)
      setFailedThisQuestion(false)
      setRecordedMiss(false)
      setLocked(false)
      setSelected(null)
      setRevealCorrect(false)
      setShowEquality(false)
      setFeedback(null)
      setFlyAmount(0)
      lumo.setThinking()
    },
    [finish, index, lumo, queue.length],
  )

  const onSelect = useCallback(
    (value: number) => {
      if (!current || locked) return
      soundEngine.unlock()
      setLocked(true)
      setSelected(value)
      const correct = value === current.fact.product

      if (!correct) {
        setFailedThisQuestion(true)
        setFirstTryStreak(0)
        setFeedback({ tone: 'bad', message: pickWrongRetryMessage(value + index) })
        lumo.reactToAnswer({ correct: false, streak: 0 })
        soundEngine.play('answer-wrong')

        let nextAnswers = answers
        if (!recordedMiss) {
          const miss: SessionAnswer = {
            fact: current.fact,
            correct: false,
            selected: value,
            elapsedMs: 0,
            attemptId: newId('ans'),
            firstTry: false,
          }
          nextAnswers = [...answers, miss]
          setAnswers(nextAnswers)
          setRecordedMiss(true)
          setPendingXp(sessionXpEarned(mode, nextAnswers))
        }

        window.setTimeout(() => {
          setLocked(false)
          setSelected(null)
          setRevealCorrect(false)
        }, 450)
        return
      }

      const firstTry = !failedThisQuestion
      const nextStreak = firstTry ? firstTryStreak + 1 : 0
      if (firstTry) setFirstTryStreak(nextStreak)
      else setFirstTryStreak(0)

      const ok: SessionAnswer = {
        fact: current.fact,
        correct: true,
        selected: value,
        elapsedMs: 0,
        attemptId: newId('ans'),
        firstTry,
      }
      const xpGain = xpDeltaForAnswer(mode, answers, ok)
      const nextAnswers = [...answers, ok]
      setAnswers(nextAnswers)
      setPendingXp(sessionXpEarned(mode, nextAnswers))
      setRevealCorrect(true)
      setFeedback({
        tone: 'ok',
        message: firstTry
          ? pickPraise(nextStreak)
          : `${formatFact(current.fact)} = ${current.fact.product}`,
      })
      if (!firstTry) setShowEquality(true)
      lumo.reactToAnswer({ correct: true, streak: nextStreak || 1 })
      soundEngine.play('answer-correct')
      if (xpGain > 0) {
        setFlyAmount(xpGain)
        setFlyKey((k) => k + 1)
        soundEngine.play('points-earned')
      }
      setBurstKey((k) => k + 1)
      flash.trigger()

      const leveled = sessionLeveledUp(progress.xp, sessionXpEarned(mode, nextAnswers))
      if (leveled.leveledUp) {
        setLevelUpLevel(leveled.newLevel)
      }

      window.setTimeout(() => {
        goNext(nextAnswers)
      }, failedThisQuestion ? 1100 : 700)
    },
    [
      answers,
      current,
      failedThisQuestion,
      firstTryStreak,
      flash,
      goNext,
      index,
      locked,
      lumo,
      mode,
      progress.xp,
      recordedMiss,
    ],
  )

  useKeyboardAnswers(!locked && Boolean(current) && !revealCorrect && !celebration, current?.options ?? [], onSelect)

  const onContinueCelebration = useCallback(() => {
    setCelebration(null)
    navigate('/missions/mates/tables/summary')
  }, [navigate])

  if (!current && !celebration) {
    return (
      <AppShell title="Entrena" showBack backTo="/missions/mates/tables/modes">
        <p className="page-intro__lead">Preparando preguntas…</p>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Entrena"
      showBack
      backTo="/missions/mates/tables/modes"
      trailing={
        <MuteToggle muted={progress.soundMuted} onToggle={() => setSoundMuted(!progress.soundMuted)} />
      }
    >
      <section className={`play-screen${celebration ? ' is-dimmed' : ''}`}>
        <SessionXpBar
          totalXp={liveTotalXp}
          highlightGain={barHighlight}
          compact
          className="play-screen__xp"
        />
        <p className="play-banner play-banner--info" role="status">
          {energyCopy.sessionMax(maxLoad)}
        </p>
        {fallbackMix ? (
          <p className="play-banner play-banner--info">Sin fallos guardados: practicando mezcla.</p>
        ) : null}
        <div className="play-progress">
          <span>
            Pregunta {Math.min(solvedCount + 1, 10)} / 10
          </span>
          <StreakBadge streak={firstTryStreak} />
        </div>
        {current ? (
          <>
            <div className="play-stage">
              <Lumo state={lumo.state} intensity={lumo.intensity} size="md" />
              <div className="play-stage__main">
                <FactPrompt fact={current.fact} highlight={flash.on} />
                {showEquality ? (
                  <p className="equality-reveal" aria-live="polite">
                    {formatFact(current.fact)} = {current.fact.product}
                  </p>
                ) : null}
                <div className="xp-fly-anchor">
                  <XpFlyLabel
                    amount={flyAmount}
                    flyKey={flyKey}
                    onArrived={() => {
                      setBarHighlight(flyAmount)
                      window.setTimeout(() => setBarHighlight(0), 600)
                    }}
                  />
                  <AnswerBurst burstKey={burstKey} />
                </div>
                {lumo.message ? (
                  <p className="lumo-caption" aria-live="polite">
                    {lumo.message}
                  </p>
                ) : null}
              </div>
            </div>
            <AnswerGrid
              options={current.options}
              disabled={locked || Boolean(celebration)}
              correctValue={current.fact.product}
              selectedValue={selected}
              reveal={revealCorrect || (locked && selected !== null && selected !== current.fact.product)}
              bounceCorrect={revealCorrect}
              shakeWrong={locked && selected !== null && selected !== current.fact.product}
              onSelect={onSelect}
            />
            {feedback ? <FeedbackBanner tone={feedback.tone} message={feedback.message} /> : null}
            <p className="demo-note">Teclado: teclas 1–4 · Hay que acertar para avanzar</p>
          </>
        ) : null}
      </section>

      <TableCompleteCelebration
        open={Boolean(celebration)}
        info={celebration}
        onContinue={onContinueCelebration}
      />
      <LevelUpCelebration
        open={levelUpLevel != null && !celebration}
        level={levelUpLevel ?? 0}
        onDone={() => setLevelUpLevel(null)}
      />
    </AppShell>
  )
}
