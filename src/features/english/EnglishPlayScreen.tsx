import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ENGLISH_MODE_LABELS,
  ENGLISH_ROUND_SIZE,
  listActiveEnglishMisses,
  recordEnglishHit,
  recordEnglishMiss,
  useEnglishSession,
  type EnglishPlayMode,
} from '@/english'
import { buildRound, englishMinigameId } from '@/minigames'
import { isEnglishPackId } from '@/feinetas/englishRegistry'
import { AppShell } from '@/components/AppShell'
import { useLumoController } from '@/lumo/useLumoController'
import { soundEngine } from '@/sound/soundEngine'
import { buildActivityStatsDelta } from '@/achievements/stats'
import { rewardMatrix, sessionXpFromCorrects } from '@/config/rewardMatrix'
import { useProgress } from '@/progress/ProgressContext'
import { usePlaySession } from '@/progress/PlayContext'
import { newId } from '@/progress/repository'
import { SideRunShell, prefersReducedMotion, useAnswerFx } from '@/run'
import '../languages/spelling/spelling.css'

function isMode(v: string | undefined): v is EnglishPlayMode {
  return (
    v === 'meaning' ||
    v === 'translate' ||
    v === 'intruder' ||
    v === 'missing' ||
    v === 'mix' ||
    v === 'review'
  )
}

function BlankDetail({ display }: { display: string }) {
  const parts = display.split(/[_·]+/)
  if (parts.length === 1) return <>{display}</>
  const spoken = parts.filter(Boolean).join('…')
  return (
    <div className="spell-blank" aria-label={`Palabra con hueco: ${spoken}`}>
      {parts.map((part, i) => (
        <span key={`blank-${i}`}>
          {part ? <span className="spell-blank__text">{part}</span> : null}
          {i < parts.length - 1 ? (
            <span className="spell-blank__slot" aria-hidden="true">
              ?
            </span>
          ) : null}
        </span>
      ))}
    </div>
  )
}

export function EnglishPlayScreen() {
  const { packId, mode: modeParam } = useParams<{ packId: string; mode: string }>()
  const navigate = useNavigate()
  const { setLastSummary, setLastMode, setLastPackId } = useEnglishSession()
  const { grantActivityEnergy, playerId } = useProgress()
  const { consumeMissionOfDay } = usePlaySession()
  const pid = playerId ?? 'local'
  const lumo = useLumoController('thinking')
  const answerFx = useAnswerFx()
  const seedRef = useRef(Date.now())
  const mode: EnglishPlayMode = isMode(modeParam) ? modeParam : 'mix'
  const validPack = packId != null && isEnglishPackId(packId)
  const modesPath = validPack ? `/missions/english/${packId}` : '/missions/english'

  const queue = useMemo(() => {
    if (!validPack || !packId) return []
    if (mode === 'review') {
      const misses = listActiveEnglishMisses(pid, packId)
      if (misses.length === 0) return []
    }
    const round = buildRound(englishMinigameId(mode), {
      count: ENGLISH_ROUND_SIZE,
      seed: seedRef.current,
      packId,
      preferEnglishMisses:
        mode === 'review' ? listActiveEnglishMisses(pid, packId) : undefined,
    })
    if (round.kind !== 'english-mcq') {
      throw new Error(`[english] ronda inesperada: ${round.kind}`)
    }
    return round.questions
  }, [mode, packId, pid, validPack])

  const [index, setIndex] = useState(0)
  const [locked, setLocked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [exitOpen, setExitOpen] = useState(false)
  const [enterKey, setEnterKey] = useState(0)
  const [hitFlash, setHitFlash] = useState(false)
  const finishedRef = useRef(false)
  const correctRef = useRef(0)
  const bestRef = useRef(0)
  const streakRef = useRef(0)
  const openedRef = useRef(false)
  const startedAtRef = useRef(Date.now())

  const question = queue[index]

  useEffect(() => {
    if (!validPack) {
      navigate('/missions/english', { replace: true })
      return
    }
    if (!isMode(modeParam)) {
      navigate(modesPath, { replace: true })
      return
    }
    if (modeParam === 'review' && listActiveEnglishMisses(pid, packId).length === 0) {
      navigate(modesPath, { replace: true })
    }
  }, [validPack, modeParam, navigate, modesPath, pid, packId])

  useEffect(() => {
    if (!openedRef.current) {
      openedRef.current = true
      setLastMode(mode)
      if (packId) setLastPackId(packId)
      soundEngine.unlock()
      soundEngine.play('activity-open')
    }
  }, [mode, packId, setLastMode, setLastPackId])

  useEffect(() => {
    if (question || finishedRef.current) return
    if (queue.length === 0 && mode === 'review') return
    finish()
  }, [question])

  function finish(opts?: { early?: boolean }) {
    if (finishedRef.current || !packId) return
    finishedRef.current = true
    const correct = correctRef.current
    const early = Boolean(opts?.early)
    setLastSummary({
      packId,
      mode,
      total: early ? Math.max(correct, index) : ENGLISH_ROUND_SIZE,
      correct,
      bestStreak: bestRef.current,
    })
    if (correct > 0) {
      const playSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
      const dailyChallenge = consumeMissionOfDay()
      grantActivityEnergy({
        sessionId: newId('eng'),
        requestedPoints: 0,
        mode: `eng-${mode}`.slice(0, 16),
        correct,
        wrong: Math.max(0, ENGLISH_ROUND_SIZE - correct),
        xpEarned: sessionXpFromCorrects(correct, rewardMatrix.english.xpPerCorrect),
        claimDailyChallenge: Boolean(dailyChallenge),
        statsDelta: buildActivityStatsDelta({
          feature: 'english',
          mode,
          correct,
          total: ENGLISH_ROUND_SIZE,
          playSeconds,
        }),
      })
    }
    navigate(`${modesPath}/summary`, { replace: true })
  }

  useEffect(() => {
    setPicked(null)
    setLocked(false)
    setHitFlash(false)
    answerFx.clearFx()
    setEnterKey((k) => k + 1)
    lumo.setThinking()
  }, [index])

  const waitingAfterMiss =
    question != null && picked !== null && picked !== question.correctIndex

  const onPickRef = useRef<(i: number) => void>(() => {})
  useEffect(() => {
    onPickRef.current = (i: number) => {
      if (!question || locked || waitingAfterMiss || hitFlash) return
      setLocked(true)
      setPicked(i)
      const ok = i === question.correctIndex
      const key = question.targetKey
      if (ok) {
        if (key) recordEnglishHit(pid, { key })
        soundEngine.play('answer-correct')
        const ns = streakRef.current + 1
        streakRef.current = ns
        bestRef.current = Math.max(bestRef.current, ns)
        correctRef.current += 1
        lumo.reactToAnswer({ correct: true, streak: ns })
        setCorrectCount(correctRef.current)
        setStreak(ns)
        setHitFlash(true)
        answerFx.spawn({ tone: 'hit', optionIndex: i, nextStreak: ns })
        window.setTimeout(() => {
          setPicked(null)
          setLocked(false)
          setHitFlash(false)
          answerFx.clearFx()
          setIndex((x) => x + 1)
        }, prefersReducedMotion() ? 700 : 950)
        return
      }

      if (key) {
        recordEnglishMiss(pid, {
          key,
          mode: question.sourceMode,
        })
      }
      soundEngine.play('answer-wrong')
      streakRef.current = 0
      lumo.reactToAnswer({ correct: false, streak: 0 })
      setStreak(0)
      answerFx.spawn({ tone: 'miss', optionIndex: i, nextStreak: 0 })
    }
  })

  useEffect(() => {
    if (!question) return
    const optionCount = question.options.length
    function onKey(e: KeyboardEvent) {
      if (locked || waitingAfterMiss || hitFlash || exitOpen) return
      const n = Number(e.key)
      if (!Number.isInteger(n) || n < 1 || n > optionCount) return
      e.preventDefault()
      onPickRef.current(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [question, locked, waitingAfterMiss, hitFlash, exitOpen])

  if (!validPack || !isMode(modeParam) || !question) return null

  const hasProgress = index > 0 || correctCount > 0 || picked !== null

  function goNext() {
    setPicked(null)
    setLocked(false)
    setHitFlash(false)
    answerFx.clearFx()
    setIndex((x) => x + 1)
  }

  function goPrev() {
    if (locked || waitingAfterMiss || hitFlash || index === 0) return
    answerFx.clearFx()
    setIndex((x) => x - 1)
  }

  function requestExit() {
    if (hasProgress) {
      setExitOpen(true)
      return
    }
    navigate(modesPath)
  }

  return (
    <AppShell
      title={ENGLISH_MODE_LABELS[mode].toUpperCase()}
      shortTitle="Inglés"
      showBack
      backTo={modesPath}
    >
      <div className="spell-play">
        <SideRunShell
          title={ENGLISH_MODE_LABELS[mode].toUpperCase()}
          current={index + 1}
          total={ENGLISH_ROUND_SIZE}
          hits={correctCount}
          streak={streak}
          lumoState={lumo.state}
          lumoIntensity={lumo.intensity}
          prompt={question.prompt}
          detail={
            question.display && /[_·]/.test(question.display) ? (
              <BlankDetail display={question.display} />
            ) : (
              question.display
            )
          }
          fx={answerFx.fx}
          lumoBoost={answerFx.lumoBoost}
          hit={hitFlash}
          miss={waitingAfterMiss}
          canPrev={index > 0 && !locked && !waitingAfterMiss && !hitFlash}
          onPrev={goPrev}
          exitOpen={exitOpen}
          onExitRequest={requestExit}
          onConfirmExit={() => {
            setExitOpen(false)
            finish({ early: true })
          }}
          onCancelExit={() => setExitOpen(false)}
          enterKey={enterKey}
          answers={
            <div
              className={`side-run-options side-run-options--count-${question.options.length}`}
              role="group"
              aria-label="Respuestas"
            >
              {question.options.map((opt, i) => {
                const isCorrect = i === question.correctIndex
                const isPicked = picked === i
                const mark =
                  picked === null
                    ? ''
                    : isCorrect
                      ? ' is-correct'
                      : isPicked
                        ? ' is-wrong'
                        : ''
                const near =
                  answerFx.fx?.kind === 'near' && answerFx.fx.optionIndex === i
                    ? answerFx.fx
                    : null
                return (
                  <button
                    key={`${question.id}-${i}`}
                    type="button"
                    className={`answer-btn${mark}${near ? ' has-near-fx' : ''}`}
                    disabled={locked || waitingAfterMiss || hitFlash}
                    onClick={() => onPickRef.current(i)}
                  >
                    <span className="answer-btn__key" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="answer-btn__value">{opt}</span>
                    {near ? (
                      <span
                        className={`answer-btn__near answer-btn__near--${near.tone}`}
                        role="status"
                      >
                        <span className="answer-btn__near-msg">{near.message}</span>
                        {near.combo != null ? (
                          <span className="answer-btn__near-combo">COMBO ×{near.combo}</span>
                        ) : null}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          }
          footer={
            waitingAfterMiss ? (
              <div className="spell-why" role="region" aria-label="Tras fallo">
                <div className="spell-why__actions">
                  <button type="button" className="btn btn-primary btn-block" onClick={goNext}>
                    Seguir
                  </button>
                </div>
              </div>
            ) : null
          }
        />
      </div>
    </AppShell>
  )
}
