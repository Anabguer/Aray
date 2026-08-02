import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnalogClock } from '@/components/AnalogClock'
import { AppShell } from '@/components/AppShell'
import { buildTrainQueue } from '@/clock/generator'
import { useClockSession } from '@/clock/ClockSessionContext'
import type { ClockLang, ClockMcqQuestion } from '@/clock/types'
import { useLumoController } from '@/lumo/useLumoController'
import { soundEngine } from '@/sound/soundEngine'
import { useDailyMission } from '@/daily/DailyMissionContext'
import { buildActivityStatsDelta } from '@/achievements/stats'
import { energyForMissionAttempt } from '@/daily/missionEnergy'
import { rewardMatrix, sessionXpFromCorrects } from '@/config/rewardMatrix'
import { useProgress } from '@/progress/ProgressContext'
import { usePlaySession } from '@/progress/PlayContext'
import { newId } from '@/progress/repository'
import { SideRunShell, prefersReducedMotion, useAnswerFx } from '@/run'
import { sideRunEnergyForProgress } from '@/reward/sideRunSettle'
import { buildClockMissPayload, clockQuestionId } from '@/math/missIds'
import {
  listActiveMathsMisses,
  rebuildClockFromMiss,
  recordMathsHit,
  recordMathsMiss,
} from '@/math/missStore'

const TRAIN_COUNT = 10
const MODES_PATH = '/missions/mates/clocks'

type QueueItem = { question: ClockMcqQuestion; lang: ClockLang }

export function ClockTrainScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const isMisses = location.pathname.endsWith('/misses')
  const { lang, setLastSummary } = useClockSession()
  const { recordProgress } = useDailyMission()
  const { grantActivityEnergy, playerId } = useProgress()
  const { consumeMissionOfDay } = usePlaySession()
  const lumo = useLumoController('thinking')
  const answerFx = useAnswerFx()
  const seedRef = useRef(Date.now())
  const finishedRef = useRef(false)
  const startedAtRef = useRef(Date.now())
  const pid = playerId ?? 'local'

  const queue: QueueItem[] = useMemo(() => {
    if (isMisses) {
      return listActiveMathsMisses(pid, 'clocks').map((e) => rebuildClockFromMiss(e))
    }
    return buildTrainQueue(lang, TRAIN_COUNT, seedRef.current).map((question) => ({
      question,
      lang,
    }))
  }, [lang, isMisses, pid])

  const roundSize = isMisses ? Math.max(1, queue.length) : TRAIN_COUNT

  const [index, setIndex] = useState(0)
  const [locked, setLocked] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [hitFlash, setHitFlash] = useState(false)
  const [missFlash, setMissFlash] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const [enterKey, setEnterKey] = useState(0)
  const openedRef = useRef(false)
  const correctRef = useRef(0)
  const streakRef = useRef(0)
  const bestRef = useRef(0)

  const item = queue[index]
  const question = item?.question
  const qLang = item?.lang ?? lang

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    soundEngine.unlock()
    soundEngine.play('activity-open')
  }, [])

  useEffect(() => {
    if (question || finishedRef.current) return
    if (isMisses && queue.length === 0) return
    finish()
  }, [question])

  function finish(opts?: { early?: boolean }) {
    if (finishedRef.current) return
    finishedRef.current = true
    const correct = correctRef.current
    const early = Boolean(opts?.early)
    setLastSummary({
      mode: 'train',
      lang,
      total: early ? Math.max(correct, index + 1) : roundSize,
      correct,
      bestStreak: bestRef.current,
    })
    if (correct > 0) {
      const full = energyForMissionAttempt('clocks', 2, playerId)
      const energy = early ? sideRunEnergyForProgress(full, correct, roundSize) : full
      const dailyChallenge = consumeMissionOfDay()
      if (!dailyChallenge) recordProgress('clocks', 2)
      grantActivityEnergy({
        sessionId: newId('clock'),
        requestedPoints: dailyChallenge ? 0 : energy,
        mode: isMisses ? 'clocks-misses' : 'clocks-train',
        correct,
        wrong: Math.max(0, roundSize - correct),
        xpEarned: sessionXpFromCorrects(correct, rewardMatrix['clocks-train'].xpPerCorrect),
        claimDailyChallenge: Boolean(dailyChallenge),
        statsDelta: buildActivityStatsDelta({
          feature: 'clocks',
          mode: 'train',
          correct,
          total: roundSize,
          playSeconds: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
        }),
      })
    }
    navigate(`${MODES_PATH}/summary`, { replace: true })
  }

  useEffect(() => {
    setSelected(null)
    setFeedback(null)
    setLocked(false)
    setHitFlash(false)
    setMissFlash(false)
    answerFx.clearFx()
    setEnterKey((k) => k + 1)
    lumo.setThinking()
  }, [index])

  if (isMisses && queue.length === 0) {
    return (
      <AppShell title="MIS FALLOS" shortTitle="Fallos" showBack backTo={MODES_PATH}>
        <section className="side-run" style={{ padding: '1.5rem' }}>
          <p className="play-banner play-banner--info">
            ¡Repaso limpio! No tienes errores pendientes.
          </p>
          <Link to={MODES_PATH} className="btn btn-primary">
            Volver a Horas
          </Link>
        </section>
      </AppShell>
    )
  }

  if (!question) return null

  const hasProgress = index > 0 || correctCount > 0

  function onPick(optionIndex: number) {
    if (locked || !question) return
    setLocked(true)
    setSelected(optionIndex)
    const ok = optionIndex === question.correctIndex
    if (ok) {
      recordMathsHit(pid, clockQuestionId(question, qLang))
      soundEngine.play('answer-correct')
      const ns = streakRef.current + 1
      streakRef.current = ns
      bestRef.current = Math.max(bestRef.current, ns)
      correctRef.current += 1
      lumo.reactToAnswer({ correct: true, streak: ns })
      setCorrectCount(correctRef.current)
      setStreak(ns)
      setHitFlash(true)
      setFeedback(qLang === 'ca' ? 'Molt bé!' : '¡Bien!')
      answerFx.spawn({ tone: 'hit', optionIndex, nextStreak: ns })
    } else {
      recordMathsMiss(pid, buildClockMissPayload(question, qLang))
      soundEngine.play('answer-wrong')
      streakRef.current = 0
      lumo.reactToAnswer({ correct: false, streak: 0 })
      setStreak(0)
      setMissFlash(true)
      const right = question.options[question.correctIndex]
      setFeedback(qLang === 'ca' ? `Era: ${right}` : `Era: ${right}`)
      answerFx.spawn({ tone: 'miss', optionIndex, nextStreak: 0 })
    }
    window.setTimeout(
      () => setIndex((i) => i + 1),
      ok
        ? prefersReducedMotion()
          ? 700
          : 950
        : prefersReducedMotion()
          ? 900
          : 1400,
    )
  }

  const isConvert = question.kind === 'convert24'
  const title = isMisses ? 'MIS FALLOS' : 'ENTRENA'

  return (
    <AppShell title={title} shortTitle={isMisses ? 'Fallos' : 'Entrena'} showBack backTo={MODES_PATH}>
      <SideRunShell
        title={isMisses ? 'MIS FALLOS · HORAS' : 'ENTRENA HORAS'}
        current={index + 1}
        total={roundSize}
        hits={correctCount}
        streak={streak}
        lumoState={lumo.state}
        lumoIntensity={lumo.intensity}
        prompt={
          isConvert
            ? (question.prompt ?? '¿Cómo se escribe en 24 h?')
            : qLang === 'ca'
              ? 'Quina hora és?'
              : '¿Qué hora es?'
        }
        detail={feedback ?? undefined}
        extra={isConvert ? undefined : <AnalogClock time={question.time} size={220} />}
        fx={answerFx.fx}
        lumoBoost={answerFx.lumoBoost}
        hit={hitFlash}
        miss={missFlash}
        canPrev={index > 0 && !locked}
        onPrev={() => {
          if (locked || index === 0) return
          setIndex((i) => i - 1)
        }}
        exitOpen={exitOpen}
        onExitRequest={() => (hasProgress ? setExitOpen(true) : navigate(MODES_PATH))}
        onConfirmExit={() => {
          setExitOpen(false)
          finish({ early: true })
        }}
        onCancelExit={() => setExitOpen(false)}
        enterKey={enterKey}
        answers={
          <div className="side-run-options" role="group" aria-label="Opciones">
            {question.options.map((opt, i) => {
              const isSel = selected === i
              const isCorrect = i === question.correctIndex
              let mark = ''
              if (selected != null && isSel && isCorrect) mark = ' is-correct'
              if (selected != null && isSel && !isCorrect) mark = ' is-wrong'
              if (selected != null && !isSel && isCorrect && locked) mark = ' is-correct'
              return (
                <button
                  key={`${question.id}-${i}`}
                  type="button"
                  className={`answer-btn${mark}`}
                  disabled={locked}
                  onClick={() => onPick(i)}
                >
                  <span className="answer-btn__key" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="answer-btn__value">{opt}</span>
                </button>
              )
            })}
          </div>
        }
      />
    </AppShell>
  )
}
