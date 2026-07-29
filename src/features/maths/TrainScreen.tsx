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
import { energyCopy, trainSessionMeta } from '@/config/rewardGoal'
import { praiseMessages, streakMessages } from '@/config/messages'
import { lumoMessages } from '@/config/lumoMessages'
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
  const flash = useFlash()
  const maxLoad = previewSessionLoad(progress, trainSessionMeta.maxRewardFromItems)

  useEffect(() => {
    if (!pendingQueue || pendingQueue.length === 0) {
      navigate('/missions/mates/tables/modes', { replace: true })
    }
  }, [pendingQueue, navigate])

  const current = queue[index]
  const solvedCount = answers.filter((a) => a.correct).length

  const finish = useCallback(
    (finalAnswers: SessionAnswer[]) => {
      const mode = activeMode === 'misses' ? 'misses' : 'train'
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
      navigate('/missions/mates/tables/summary')
    },
    [activeMode, applySession, navigate, selection.tables, setLastResult, setPendingQueue],
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
      lumo.setThinking()
    },
    [finish, index, lumo, queue.length],
  )

  const onSelect = useCallback(
    (value: number) => {
      if (!current || locked) return
      setLocked(true)
      setSelected(value)
      const correct = value === current.fact.product

      if (!correct) {
        setFailedThisQuestion(true)
        setFirstTryStreak(0)
        setFeedback({ tone: 'bad', message: lumoMessages.tryAgain })
        lumo.reactToAnswer({ correct: false, streak: 0 })
        soundEngine.play('wrong')

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
      const nextAnswers = [...answers, ok]
      setAnswers(nextAnswers)
      setRevealCorrect(true)
      setFeedback({
        tone: 'ok',
        message: firstTry
          ? pickPraise(nextStreak)
          : `${formatFact(current.fact)} = ${current.fact.product}`,
      })
      if (!firstTry) setShowEquality(true)
      lumo.reactToAnswer({ correct: true, streak: nextStreak || 1 })
      soundEngine.play('correct')
      flash.trigger()

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
      locked,
      lumo,
      recordedMiss,
    ],
  )

  useKeyboardAnswers(!locked && Boolean(current) && !revealCorrect, current?.options ?? [], onSelect)

  if (!current) {
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
      <section className="play-screen">
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
          <span>Racha a la 1ª: {firstTryStreak}</span>
        </div>
        <div className="play-stage">
          <Lumo state={lumo.state} intensity={lumo.intensity} size="md" />
          <div className="play-stage__main">
            <FactPrompt fact={current.fact} highlight={flash.on} />
            {showEquality ? (
              <p className="equality-reveal" aria-live="polite">
                {formatFact(current.fact)} = {current.fact.product}
              </p>
            ) : null}
            {lumo.message ? (
              <p className="lumo-caption" aria-live="polite">
                {lumo.message}
              </p>
            ) : null}
          </div>
        </div>
        <AnswerGrid
          options={current.options}
          disabled={locked}
          correctValue={current.fact.product}
          selectedValue={selected}
          reveal={revealCorrect || (locked && selected !== null && selected !== current.fact.product)}
          onSelect={onSelect}
        />
        {feedback ? <FeedbackBanner tone={feedback.tone} message={feedback.message} /> : null}
        <p className="demo-note">Teclado: teclas 1–4 · Hay que acertar para avanzar</p>
      </section>
    </AppShell>
  )
}
