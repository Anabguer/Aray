import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import {
  AnswerGrid,
  FactPrompt,
  useFlash,
  useKeyboardAnswers,
} from '@/components/quiz/QuizWidgets'
import { AnswerBurst, XpFlyLabel } from '@/feedback/AnswerFx'
import { SessionXpBar } from '@/feedback/SessionXpBar'
import { sessionLeveledUp } from '@/feedback/sessionOutcome'
import { LevelUpCelebration } from '@/feedback/TableCompleteCelebration'
import { pickWrongRetryMessage, sessionXpEarned, xpDeltaForAnswer } from '@/feedback/xpPreview'
import { challengeModeConfig } from '@/config/playConfig'
import { energyCopy } from '@/config/rewardGoal'
import { praiseMessages, streakMessages } from '@/config/messages'
import { useLumoController } from '@/lumo/useLumoController'
import { pickNextFact, toQuestionCard } from '@/math/selector'
import { factKeyOf, factsForTables } from '@/math/tables'
import type { QuestionCard, SessionAnswer } from '@/math/types'
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
  return praiseMessages[Math.floor(Math.random() * praiseMessages.length)]
}

type Phase = 'intro' | 'countdown' | 'play' | 'ended'

export function ChallengeScreen() {
  const navigate = useNavigate()
  const { progress, applySession } = useProgress()
  const { selection, setLastResult, setActiveMode, consumeMissionOfDay } = usePlaySession()
  const pool = factsForTables(selection.tables)
  const preferred = selection.tables.length === 1 ? selection.tables[0] : null
  const lumo = useLumoController('thinking')
  const answerFx = useAnswerFx()
  const sessionIdRef = useRef(newId('challenge'))
  const maxLoad = previewSessionLoad(progress, challengeModeConfig.maxRewardFromItems)

  const [phase, setPhase] = useState<Phase>('intro')
  const [countdown, setCountdown] = useState<number>(challengeModeConfig.countdownSec)
  const [remainingMs, setRemainingMs] = useState(challengeModeConfig.durationSec * 1000)
  const [card, setCard] = useState<QuestionCard>(() =>
    toQuestionCard(pickNextFact(pool, progress, null), preferred),
  )
  const [answers, setAnswers] = useState<SessionAnswer[]>([])
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [locked, setLocked] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [burstKey, setBurstKey] = useState(0)
  const [flyKey, setFlyKey] = useState(0)
  const [flyAmount, setFlyAmount] = useState(0)
  const [pendingXp, setPendingXp] = useState(0)
  const [barHighlight, setBarHighlight] = useState(0)
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null)
  const [exitOpen, setExitOpen] = useState(false)
  const [enterKey, setEnterKey] = useState(0)
  const [hitFlash, setHitFlash] = useState(false)
  const [missFlash, setMissFlash] = useState(false)
  const flash = useFlash(320)
  const finished = useRef(false)
  const answersRef = useRef(answers)
  const scoreRef = useRef(score)
  const lastKeyRef = useRef<string | null>(null)
  const endAtRef = useRef(0)
  const warnedUrgent = useRef(false)

  answersRef.current = answers
  scoreRef.current = score

  const fraction = Math.max(0, Math.min(1, remainingMs / (challengeModeConfig.durationSec * 1000)))
  const timerTone =
    fraction >= challengeModeConfig.colorOkAbove
      ? 'ok'
      : fraction >= challengeModeConfig.colorWarnAbove
        ? 'warn'
        : 'urgent'

  const endChallenge = useCallback(() => {
    if (finished.current) return
    finished.current = true
    setPhase('ended')
    setLocked(true)
    setActiveMode('challenge')
    const mission = consumeMissionOfDay()
    const result = applySession({
      mode: 'challenge',
      tables: selection.tables,
      answers: answersRef.current,
      score: scoreRef.current,
      bestStreak: 0,
      sessionId: sessionIdRef.current,
      isMissionOfDay: Boolean(mission),
      missionCode: mission?.code,
    })
    setLastResult(result)
    soundEngine.play('activity-complete')
    navigate('/missions/mates/tables/summary')
  }, [applySession, consumeMissionOfDay, navigate, selection.tables, setActiveMode, setLastResult])

  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown > 0) {
      const t = window.setTimeout(() => setCountdown((c) => c - 1), 700)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => {
      endAtRef.current = performance.now() + challengeModeConfig.durationSec * 1000
      setPhase('play')
      lumo.setThinking()
      soundEngine.play('activity-open')
    }, 450)
    return () => window.clearTimeout(t)
  }, [countdown, lumo, phase])

  useEffect(() => {
    if (phase !== 'play') return
    let raf = 0
    const tick = () => {
      const left = Math.max(0, endAtRef.current - performance.now())
      setRemainingMs(left)
      if (
        left > 0 &&
        left / (challengeModeConfig.durationSec * 1000) < challengeModeConfig.colorWarnAbove &&
        !warnedUrgent.current
      ) {
        warnedUrgent.current = true
        soundEngine.play('ui-click')
      }
      if (left <= 0) {
        endChallenge()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [endChallenge, phase])

  const nextCard = useCallback(() => {
    const fact = pickNextFact(pool, progress, lastKeyRef.current)
    lastKeyRef.current = factKeyOf(fact)
    setCard(toQuestionCard(fact, preferred))
    setFlyAmount(0)
    setHitFlash(false)
    setMissFlash(false)
    answerFx.clearFx()
    setEnterKey((k) => k + 1)
    lumo.setThinking()
  }, [answerFx, lumo, pool, preferred, progress])

  const onSelect = useCallback(
    (value: number) => {
      if (phase !== 'play' || locked || remainingMs <= 0 || finished.current) return
      soundEngine.unlock()
      setLocked(true)
      setSelected(value)
      const correct = value === card.fact.product
      const answer: SessionAnswer = {
        fact: card.fact,
        correct,
        selected: value,
        elapsedMs: 0,
        attemptId: newId('ans'),
        firstTry: true,
      }
      const prevAnswers = answersRef.current
      const nextAnswers = [...prevAnswers, answer]
      setAnswers(nextAnswers)
      answersRef.current = nextAnswers
      const optIndex = Math.max(0, card.options.indexOf(value))

      if (correct) {
        const nextStreak = streak + 1
        setStreak(nextStreak)
        const gain = 10 + Math.min(20, nextStreak * 2)
        const nextScore = scoreRef.current + gain
        setScore(nextScore)
        scoreRef.current = nextScore
        setFeedback(pickPraise(nextStreak))
        setHitFlash(true)
        setMissFlash(false)
        lumo.reactToAnswer({ correct: true, streak: nextStreak })
        soundEngine.play('answer-correct')
        const xpGain = xpDeltaForAnswer('challenge', prevAnswers, answer)
        setPendingXp(sessionXpEarned('challenge', nextAnswers, nextScore, progress.bestChallengeScore))
        answerFx.spawn({
          tone: 'hit',
          optionIndex: optIndex,
          nextStreak,
          xpGranted: xpGain > 0 ? xpGain : undefined,
        })
        if (xpGain > 0) {
          setFlyAmount(xpGain)
          setFlyKey((k) => k + 1)
          soundEngine.play('points-earned')
        }
        const lvl = sessionLeveledUp(
          progress.xp,
          sessionXpEarned('challenge', nextAnswers, nextScore, progress.bestChallengeScore),
        )
        if (lvl.leveledUp) setLevelUpLevel(lvl.newLevel)
        setBurstKey((k) => k + 1)
        flash.trigger()
      } else {
        setStreak(0)
        setFeedback(pickWrongRetryMessage(value))
        setHitFlash(false)
        setMissFlash(true)
        lumo.reactToAnswer({ correct: false, streak: 0 })
        soundEngine.play('answer-wrong')
        answerFx.spawn({ tone: 'miss', optionIndex: optIndex, nextStreak: 0 })
        setPendingXp(sessionXpEarned('challenge', nextAnswers, scoreRef.current, progress.bestChallengeScore))
      }

      window.setTimeout(() => {
        if (finished.current) return
        setLocked(false)
        setSelected(null)
        setFeedback(null)
        nextCard()
      }, prefersReducedMotion() ? 420 : 620)
    },
    [
      answerFx,
      card,
      flash,
      locked,
      lumo,
      nextCard,
      phase,
      progress.bestChallengeScore,
      progress.xp,
      remainingMs,
      streak,
    ],
  )

  useKeyboardAnswers(phase === 'play' && !locked && remainingMs > 0, card.options, onSelect)

  const secondsLeft = Math.ceil(remainingMs / 1000)
  const hits = answers.filter((a) => a.correct).length
  const hasProgress = answers.length > 0 || phase === 'play' || phase === 'countdown'
  const isCorrectFlash = locked && selected === card.fact.product

  return (
    <AppShell title="Reto" showBack backTo={MODES_PATH}>
      <SessionXpBar
        totalXp={progress.xp + pendingXp}
        highlightGain={barHighlight}
        compact
        className="play-screen__xp"
      />

      {phase === 'intro' ? (
        <div className="countdown-overlay" role="dialog" aria-labelledby="challenge-intro-title">
          <p id="challenge-intro-title" className="countdown-overlay__label">
            ⚡ Reto rápido
          </p>
          <ul className="countdown-overlay__perks">
            <li>XP ×{challengeModeConfig.xpMultiplier}</li>
            <li>{energyCopy.sessionMax(maxLoad)}</li>
          </ul>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              soundEngine.unlock()
              setCountdown(challengeModeConfig.countdownSec)
              setPhase('countdown')
              soundEngine.play('ui-click')
            }}
          >
            Empezar
          </button>
        </div>
      ) : null}

      {phase === 'countdown' ? (
        <div className="countdown-overlay" role="status" aria-live="assertive">
          <p className="countdown-overlay__label">⚡ Reto rápido</p>
          <p className="countdown-overlay__num">{countdown > 0 ? countdown : '¡YA!'}</p>
        </div>
      ) : null}

      {phase === 'play' || phase === 'ended' ? (
        <SideRunShell
          title="RETO"
          current={Math.max(1, hits + (locked && isCorrectFlash ? 0 : 1))}
          total={Math.max(hits + 1, 12)}
          hits={hits}
          streak={streak}
          countLabel={
            <span className={`challenge-timer challenge-timer--${timerTone}`} aria-live="polite">
              {secondsLeft}s
            </span>
          }
          note={
            <>
              {score} pts · ×{challengeModeConfig.xpMultiplier} XP
              {streak >= 2 ? ` · ¡Combo ×${streak}!` : ''}
            </>
          }
          lumoState={lumo.state}
          lumoIntensity={lumo.intensity}
          prompt="¿Cuánto es?"
          detail={
            <>
              <FactPrompt fact={card.fact} highlight={flash.on} />
              <span className="side-run__hint">{feedback ?? 'Teclado 1–4 · Acierto = puntos'}</span>
            </>
          }
          extra={
            <>
              <div
                className={`timer-bar timer-bar--${timerTone}${timerTone === 'urgent' ? ' is-pulse' : ''}`}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={challengeModeConfig.durationSec}
                aria-valuenow={secondsLeft}
                aria-label={`Tiempo restante ${secondsLeft} segundos`}
              >
                <span style={{ width: `${fraction * 100}%` }} />
              </div>
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
            </>
          }
          fx={answerFx.fx}
          lumoBoost={answerFx.lumoBoost}
          hit={hitFlash}
          miss={missFlash}
          canPrev={false}
          exitOpen={exitOpen}
          onExitRequest={() => (hasProgress ? setExitOpen(true) : navigate(MODES_PATH))}
          onConfirmExit={() => {
            setExitOpen(false)
            if (answersRef.current.length > 0 || scoreRef.current > 0) {
              endChallenge()
              return
            }
            finished.current = true
            navigate(MODES_PATH)
          }}
          onCancelExit={() => setExitOpen(false)}
          enterKey={enterKey}
          answers={
            <AnswerGrid
              options={card.options}
              disabled={phase !== 'play' || locked || remainingMs <= 0}
              correctValue={card.fact.product}
              selectedValue={selected}
              reveal={locked}
              bounceCorrect={locked && selected === card.fact.product}
              shakeWrong={locked && selected !== null && selected !== card.fact.product}
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

      <LevelUpCelebration
        open={levelUpLevel != null}
        level={levelUpLevel ?? 0}
        onDone={() => setLevelUpLevel(null)}
      />
    </AppShell>
  )
}
