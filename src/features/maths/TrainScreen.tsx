import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import {
  AnswerGrid,
  FactPrompt,
  useFlash,
  useKeyboardAnswers,
} from '@/components/quiz/QuizWidgets'
import { AnswerBurst, XpFlyLabel } from '@/feedback/AnswerFx'
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
import { useLumoController } from '@/lumo/useLumoController'
import type { QuestionCard, SessionAnswer } from '@/math/types'
import { formatFact } from '@/math/tables'
import { usePlaySession } from '@/progress/PlayContext'
import { useProgress } from '@/progress/ProgressContext'
import { newId } from '@/progress/repository'
import { previewSessionLoad } from '@/reward/engine'
import { soundEngine } from '@/sound/soundEngine'
import { SideRunShell, prefersReducedMotion, useAnswerFx } from '@/run'

const MODES_PATH = '/missions/mates/tables/modes'

function pickPraise(streak: number): string {
  if (streak >= 5) return energyCopy.streakOnFire
  if (streakMessages[streak]) return streakMessages[streak]
  return praiseMessages[streak % praiseMessages.length]
}

export function TrainScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const fallbackMix = Boolean((location.state as { fallbackMix?: boolean } | null)?.fallbackMix)
  const { progress, applySession } = useProgress()
  const { selection, pendingQueue, setPendingQueue, setLastResult, activeMode, consumeMissionOfDay } =
    usePlaySession()
  const lumo = useLumoController('thinking')
  const answerFx = useAnswerFx()
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
  const [exitOpen, setExitOpen] = useState(false)
  const [enterKey, setEnterKey] = useState(0)
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
      const mission = consumeMissionOfDay()
      const result = applySession({
        mode,
        tables: selection.tables,
        answers: finalAnswers,
        score: finalAnswers.filter((a) => a.correct && (a.firstTry ?? true)).length,
        bestStreak: 0,
        sessionId: sessionIdRef.current,
        isMissionOfDay: Boolean(mission),
        missionCode: mission?.code,
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
    [
      applySession,
      consumeMissionOfDay,
      mode,
      progress,
      selection.tables,
      setLastResult,
      setPendingQueue,
    ],
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
      answerFx.clearFx()
      setEnterKey((k) => k + 1)
      lumo.setThinking()
    },
    [answerFx, finish, index, lumo, queue.length],
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
        answerFx.spawn({
          tone: 'miss',
          optionIndex: Math.max(0, current.options.indexOf(value)),
          nextStreak: 0,
        })

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
          answerFx.clearFx()
        }, prefersReducedMotion() ? 420 : 620)
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
      answerFx.spawn({
        tone: 'hit',
        optionIndex: Math.max(0, current.options.indexOf(value)),
        nextStreak: nextStreak || 1,
        xpGranted: xpGain > 0 ? xpGain : undefined,
      })
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
      }, failedThisQuestion ? (prefersReducedMotion() ? 900 : 1100) : prefersReducedMotion() ? 700 : 950)
    },
    [
      answerFx,
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
      <AppShell title="Entrena" showBack backTo={MODES_PATH}>
        <p className="page-intro__lead">Preparando preguntas…</p>
      </AppShell>
    )
  }

  const hits = answers.filter((a) => a.correct && (a.firstTry ?? true)).length
  const qNum = Math.min(solvedCount + 1, 10)
  const isWrongFlash = locked && selected !== null && selected !== current?.fact.product && !revealCorrect

  return (
    <AppShell title="Entrena" showBack backTo={MODES_PATH}>
      <div className={celebration ? 'is-dimmed' : undefined}>
        <SessionXpBar
          totalXp={liveTotalXp}
          highlightGain={barHighlight}
          compact
          className="play-screen__xp"
        />
        {fallbackMix ? (
          <p className="play-banner play-banner--info">Sin fallos guardados: practicando mezcla.</p>
        ) : null}

        {current ? (
          <SideRunShell
            title="ENTRENA"
            current={qNum}
            total={10}
            hits={hits}
            streak={firstTryStreak}
            note={
              <>
                {energyCopy.sessionMax(maxLoad)}
                {firstTryStreak >= 2 ? ` · Combo ×${firstTryStreak}` : ''}
              </>
            }
            lumoState={lumo.state}
            lumoIntensity={lumo.intensity}
            prompt="¿Cuánto es?"
            detail={
              <>
                <FactPrompt fact={current.fact} highlight={flash.on} />
                {showEquality ? (
                  <span className="side-run__hint">
                    {formatFact(current.fact)} = {current.fact.product}
                  </span>
                ) : feedback ? (
                  <span className="side-run__hint">{feedback.message}</span>
                ) : (
                  <span className="side-run__hint">Teclado 1–4 · Hay que acertar para avanzar</span>
                )}
              </>
            }
            extra={
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
            }
            fx={answerFx.fx}
            lumoBoost={answerFx.lumoBoost}
            hit={revealCorrect}
            miss={isWrongFlash}
            canPrev={false}
            exitOpen={exitOpen}
            onExitRequest={() => {
              if (answers.length > 0 || index > 0) setExitOpen(true)
              else navigate(MODES_PATH)
            }}
            onConfirmExit={() => {
              setExitOpen(false)
              setPendingQueue(null)
              navigate(MODES_PATH)
            }}
            onCancelExit={() => setExitOpen(false)}
            enterKey={enterKey}
            answers={
              <AnswerGrid
                options={current.options}
                disabled={locked || Boolean(celebration)}
                correctValue={current.fact.product}
                selectedValue={selected}
                reveal={revealCorrect || isWrongFlash}
                bounceCorrect={revealCorrect}
                shakeWrong={isWrongFlash}
                onSelect={onSelect}
                nearFx={
                  answerFx.fx?.kind === 'near' && typeof answerFx.fx.optionIndex === 'number'
                    ? {
                        index: answerFx.fx.optionIndex,
                        tone: answerFx.fx.tone,
                        message: answerFx.fx.message,
                        xp: answerFx.fx.xp,
                        combo: answerFx.fx.combo,
                      }
                    : null
                }
              />
            }
          />
        ) : null}
      </div>

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
