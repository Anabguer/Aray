import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import {
  AnswerGrid,
  FactPrompt,
  FeedbackBanner,
  MuteToggle,
  useFlash,
  useKeyboardAnswers,
} from '@/components/quiz/QuizWidgets'
import { challengeModeConfig } from '@/config/playConfig'
import { energyCopy } from '@/config/rewardGoal'
import { praiseMessages, streakMessages, wrongHelpMessage } from '@/config/messages'
import { Lumo } from '@/lumo/Lumo'
import { useLumoController } from '@/lumo/useLumoController'
import { pickNextFact, toQuestionCard } from '@/math/selector'
import { factKeyOf, factsForTables } from '@/math/tables'
import type { QuestionCard, SessionAnswer } from '@/math/types'
import { usePlaySession } from '@/progress/PlayContext'
import { useProgress } from '@/progress/ProgressContext'
import { newId } from '@/progress/repository'
import { previewSessionLoad } from '@/reward/engine'
import { soundEngine } from '@/sound/soundEngine'

function pickPraise(streak: number): string {
  if (streak >= 5) return energyCopy.streakOnFire
  if (streakMessages[streak]) return streakMessages[streak]
  return praiseMessages[Math.floor(Math.random() * praiseMessages.length)]
}

type Phase = 'intro' | 'countdown' | 'play' | 'ended'

export function ChallengeScreen() {
  const navigate = useNavigate()
  const { progress, applySession, setSoundMuted } = useProgress()
  const { selection, setLastResult, setActiveMode } = usePlaySession()
  const pool = factsForTables(selection.tables)
  const preferred = selection.tables.length === 1 ? selection.tables[0] : null
  const lumo = useLumoController('thinking')
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
    const result = applySession({
      mode: 'challenge',
      tables: selection.tables,
      answers: answersRef.current,
      score: scoreRef.current,
      bestStreak: 0,
      sessionId: sessionIdRef.current,
    })
    setLastResult(result)
    soundEngine.play('reward')
    navigate('/missions/mates/tables/summary')
  }, [applySession, navigate, selection.tables, setActiveMode, setLastResult])

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
      soundEngine.play('correct')
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
        soundEngine.play('tick')
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
    lumo.setThinking()
  }, [lumo, pool, preferred, progress])

  const onSelect = useCallback(
    (value: number) => {
      if (phase !== 'play' || locked || remainingMs <= 0 || finished.current) return
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
      const nextAnswers = [...answersRef.current, answer]
      setAnswers(nextAnswers)
      answersRef.current = nextAnswers

      if (correct) {
        const nextStreak = streak + 1
        setStreak(nextStreak)
        const gain = 10 + Math.min(20, nextStreak * 2)
        const nextScore = scoreRef.current + gain
        setScore(nextScore)
        scoreRef.current = nextScore
        setFeedback(pickPraise(nextStreak))
        lumo.reactToAnswer({ correct: true, streak: nextStreak })
        soundEngine.play('correct')
        flash.trigger()
      } else {
        setStreak(0)
        setFeedback(wrongHelpMessage(card.fact.a, card.fact.b, card.fact.product))
        lumo.reactToAnswer({ correct: false, streak: 0 })
        soundEngine.play('wrong')
      }

      window.setTimeout(() => {
        if (finished.current) return
        setLocked(false)
        setSelected(null)
        setFeedback(null)
        nextCard()
      }, 420)
    },
    [card, flash, locked, lumo, nextCard, phase, remainingMs, streak],
  )

  useKeyboardAnswers(phase === 'play' && !locked && remainingMs > 0, card.options, onSelect)

  const secondsLeft = Math.ceil(remainingMs / 1000)

  return (
    <AppShell
      title="Reto"
      showBack
      backTo="/missions/mates/tables/modes"
      trailing={
        <MuteToggle muted={progress.soundMuted} onToggle={() => setSoundMuted(!progress.soundMuted)} />
      }
    >
      <section className="play-screen">
        {phase === 'intro' ? (
          <div className="countdown-overlay" role="dialog" aria-labelledby="challenge-intro-title">
            <p id="challenge-intro-title" className="countdown-overlay__label">
              ⚡ Reto rápido
            </p>
            <ul className="countdown-overlay__perks">
              <li>XP ×{challengeModeConfig.xpMultiplier}</li>
              {challengeModeConfig.coinMultiplier > 1 ? (
                <li>Monedas ×{challengeModeConfig.coinMultiplier}</li>
              ) : null}
              <li>{energyCopy.sessionMax(maxLoad)}</li>
            </ul>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setCountdown(challengeModeConfig.countdownSec)
                setPhase('countdown')
                soundEngine.play('tick')
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

        <div className="challenge-hud">
          <div className="challenge-hud__left">
            <span
              className={`challenge-timer challenge-timer--${timerTone}`}
              aria-live="polite"
            >
              {secondsLeft}s
            </span>
            <span className="challenge-mult" aria-label="Multiplicador de XP">
              ×{challengeModeConfig.xpMultiplier} XP
            </span>
          </div>
          <div className="challenge-score">
            <span>{score} pts</span>
            <span>Racha {streak}</span>
          </div>
        </div>

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

        <div className="play-stage">
          <Lumo state={lumo.state} intensity={lumo.intensity} size="md" />
          <div className="play-stage__main">
            <FactPrompt fact={card.fact} highlight={flash.on} />
            {lumo.message ? (
              <p className="lumo-caption" aria-live="polite">
                {lumo.message}
              </p>
            ) : null}
          </div>
        </div>
        <AnswerGrid
          options={card.options}
          disabled={phase !== 'play' || locked || remainingMs <= 0}
          correctValue={card.fact.product}
          selectedValue={selected}
          reveal={locked}
          onSelect={onSelect}
        />
        {feedback ? (
          <FeedbackBanner tone={selected === card.fact.product ? 'ok' : 'bad'} message={feedback} />
        ) : null}
      </section>
    </AppShell>
  )
}
