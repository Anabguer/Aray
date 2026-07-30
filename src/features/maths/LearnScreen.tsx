import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import {
  AnswerGrid,
  ConfirmDialog,
  useKeyboardAnswers,
} from '@/components/quiz/QuizWidgets'
import { rewardRules } from '@/config/rewards'
import { MAX_MULTIPLIER, MIX_TABLES } from '@/config/playConfig'
import { sessionXpEarned } from '@/feedback/xpPreview'
import { Lumo } from '@/lumo/Lumo'
import { useLumoController } from '@/lumo/useLumoController'
import { buildAnswerOptions } from '@/math/options'
import { makeFact } from '@/math/tables'
import { normalizeTableProgress, tableStatus } from '@/math/tableMastery'
import type { SessionAnswer } from '@/math/types'
import { usePlaySession } from '@/progress/PlayContext'
import { useProgress } from '@/progress/ProgressContext'
import { newId } from '@/progress/repository'
import { soundEngine } from '@/sound/soundEngine'

type LearnPhase = 'ask' | 'hint' | 'reveal' | 'done'

const HIT_MESSAGES = ['¡CLAVADO!', 'EZ 😎', '+10 XP', 'DOMINADA'] as const
const MISS_MESSAGES = ['Casi. Otro try.', 'Ese era bait 😏', 'Reintenta, que esta cae.'] as const

function pickMessage<T extends string>(pool: readonly T[]): T {
  return pool[Math.floor(Math.random() * pool.length)]!
}

export function LearnScreen() {
  const navigate = useNavigate()
  const { selection } = usePlaySession()
  const { progress, applySession } = useProgress()
  const tables = selection.mix ? [...MIX_TABLES] : selection.tables.length ? selection.tables : [7]
  const lumo = useLumoController('thinking')
  const sessionIdRef = useRef(newId('learn'))
  const appliedRef = useRef(false)
  const answersRef = useRef<SessionAnswer[]>([])

  const [tableIndex, setTableIndex] = useState(0)
  const [row, setRow] = useState(1)
  const [phase, setPhase] = useState<LearnPhase>('ask')
  const [locked, setLocked] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [failedThisQuestion, setFailedThisQuestion] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [praise, setPraise] = useState<string | null>(null)
  const [enterKey, setEnterKey] = useState(0)
  const [answers, setAnswers] = useState<SessionAnswer[]>([])
  const [hits, setHits] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [runPerfect, setRunPerfect] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const [burstKey, setBurstKey] = useState(0)
  const [xpPop, setXpPop] = useState(0)

  const table = tables[Math.min(tableIndex, tables.length - 1)] ?? 2
  const product = table * row
  const options = useMemo(() => buildAnswerOptions(makeFact(table, row)), [table, row])
  const singleTable = tables.length === 1

  const opIndex = tableIndex * MAX_MULTIPLIER + row
  const opTotal = tables.length * MAX_MULTIPLIER
  const completedOps = Math.max(0, opIndex - 1)
  const barPct = Math.min(100, (completedOps / opTotal) * 100)

  const tableProgress = normalizeTableProgress(progress.tables[String(table)])
  const statusLabel = tableStatus(tableProgress).label

  useEffect(() => {
    setEnterKey((k) => k + 1)
  }, [table, row])

  function resetAsk() {
    setPhase('ask')
    setLocked(false)
    setSelected(null)
    setFailedThisQuestion(false)
    setHint(null)
    setPraise(null)
    lumo.setThinking()
  }

  function restartRun() {
    sessionIdRef.current = newId('learn')
    appliedRef.current = false
    answersRef.current = []
    setTableIndex(0)
    setRow(1)
    setAnswers([])
    setHits(0)
    setXpEarned(0)
    setRunPerfect(false)
    resetAsk()
  }

  function finishRun(finalAnswers: SessionAnswer[], finalHits: number) {
    let earned = 0
    if (!appliedRef.current && finalAnswers.length > 0) {
      appliedRef.current = true
      const result = applySession({
        mode: 'learn',
        tables,
        answers: finalAnswers,
        score: finalHits,
        bestStreak: 0,
        sessionId: sessionIdRef.current,
      })
      earned = result.xpEarned
    } else {
      earned = sessionXpEarned('learn', finalAnswers)
    }
    setXpEarned(earned)
    setRunPerfect(finalHits === opTotal && finalAnswers.length > 0)
    setPhase('done')
    lumo.celebrate(finalHits === opTotal ? 'record' : 'streak10')
    soundEngine.play('activity-complete')
  }

  function goPrev() {
    if (locked || phase === 'reveal') return
    if (row > 1) {
      setRow(row - 1)
      resetAsk()
      return
    }
    if (tableIndex > 0) {
      setTableIndex(tableIndex - 1)
      setRow(MAX_MULTIPLIER)
      resetAsk()
    }
  }

  function goNextOp(nextAnswers: SessionAnswer[], nextHits: number) {
    if (row < MAX_MULTIPLIER) {
      setRow(row + 1)
      resetAsk()
      return
    }
    if (tableIndex < tables.length - 1) {
      setTableIndex(tableIndex + 1)
      setRow(1)
      resetAsk()
      return
    }
    finishRun(nextAnswers, nextHits)
  }

  const onSelect = useCallback(
    (value: number) => {
      if (phase === 'reveal' || phase === 'done' || locked) return
      soundEngine.unlock()
      setLocked(true)
      setSelected(value)

      if (value === product) {
        const firstTry = !failedThisQuestion
        const answer: SessionAnswer = {
          fact: makeFact(table, row),
          correct: true,
          selected: value,
          elapsedMs: 0,
          attemptId: newId('ans'),
          firstTry,
        }
        const nextAnswers = [...answersRef.current, answer]
        answersRef.current = nextAnswers
        setAnswers(nextAnswers)
        const nextHits = firstTry ? hits + 1 : hits
        if (firstTry) setHits(nextHits)
        setPhase('reveal')
        setHint(null)
        setPraise(pickMessage(HIT_MESSAGES))
        setBurstKey((k) => k + 1)
        setXpPop(rewardRules.xpPerCorrect)
        lumo.reactToAnswer({ correct: true, streak: firstTry ? 2 : 1 })
        soundEngine.play('answer-correct')
        window.setTimeout(() => goNextOp(nextAnswers, nextHits), 1100)
        return
      }

      const missAnswer: SessionAnswer = {
        fact: makeFact(table, row),
        correct: false,
        selected: value,
        elapsedMs: 0,
        attemptId: newId('ans'),
        firstTry: !failedThisQuestion,
      }
      const withMiss = [...answersRef.current, missAnswer]
      answersRef.current = withMiss
      setAnswers(withMiss)
      setFailedThisQuestion(true)
      setHint(pickMessage(MISS_MESSAGES))
      setPraise(null)
      lumo.reactToAnswer({ correct: false, streak: 0 })
      soundEngine.play('answer-wrong')
      setPhase('hint')
      window.setTimeout(() => {
        setLocked(false)
        setSelected(null)
      }, 480)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run snapshot for timeout advance
    [phase, locked, product, failedThisQuestion, hits, table, row, tableIndex, tables.length, lumo],
  )

  useKeyboardAnswers(phase !== 'reveal' && phase !== 'done' && !locked, options, onSelect)

  const canPrev = !(tableIndex === 0 && row === 1) && phase !== 'reveal' && phase !== 'done'
  const hasRunProgress = completedOps > 0 || answers.length > 0 || hits > 0
  const isCorrectReveal = phase === 'reveal'
  const isWrongFlash = phase === 'hint' && locked && selected !== null

  function requestExit() {
    if (hasRunProgress && phase !== 'done') {
      setExitOpen(true)
      return
    }
    navigate('/missions/mates/tables/modes')
  }

  const nodes = singleTable
    ? Array.from({ length: MAX_MULTIPLIER }, (_, i) => i + 1)
    : Array.from({ length: MAX_MULTIPLIER }, (_, i) => i + 1)

  return (
    <AppShell title="APRENDE" showBack backTo="/missions/mates/tables/modes">
      <section className="learn-lab" aria-label="Laboratorio Aprende">
        {phase === 'done' ? (
          <div
            className={`learn-lab__done${runPerfect && singleTable ? ' is-perfect' : ''}`}
            role="status"
          >
            {runPerfect && singleTable ? <span className="learn-lab__done-burst" aria-hidden="true" /> : null}
            <Lumo state="celebration" intensity={runPerfect ? 4 : 3} size="md" />
            {runPerfect && singleTable ? (
              <h2 className="learn-lab__done-title learn-lab__done-title--dominate">
                TABLA DEL {table} DOMINADA
              </h2>
            ) : (
              <h2 className="learn-lab__done-title">RUN COMPLETA</h2>
            )}
            <p className="learn-lab__done-score">
              {hits}/{opTotal}
            </p>
            <p className="learn-lab__done-text">
              +{xpEarned} XP · {singleTable ? statusLabel : 'Mezcla'}
            </p>
            <p className="learn-lab__done-lumo">
              {runPerfect
                ? 'GG. Esa tabla ya es tuya.'
                : hits >= Math.ceil(opTotal * 0.8)
                  ? 'Sólida. Otra run y la clavas.'
                  : 'Calentamiento hecho. Remata en la siguiente.'}
            </p>
            <div className="learn-lab__done-actions">
              <button type="button" className="btn btn-primary btn-block" onClick={restartRun}>
                OTRA RUN
              </button>
              <Link to="/missions/mates" className="btn btn-ghost btn-block">
                VOLVER A MATEMÁTICAS
              </Link>
            </div>
          </div>
        ) : (
          <>
            <header className="learn-lab__hud">
              <div className="learn-lab__hud-top">
                <p className="learn-lab__table">
                  TABLA DEL {table}
                  <span className="learn-lab__table-run"> · RUN ACTUAL</span>
                </p>
                <p className="learn-lab__count" aria-live="polite">
                  {row} de {MAX_MULTIPLIER}
                </p>
              </div>
              <div className="learn-lab__track">
                <div
                  className="learn-lab__bar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={opTotal}
                  aria-valuenow={completedOps}
                  aria-label={`Progreso: ${row} de ${MAX_MULTIPLIER}`}
                >
                  <span style={{ width: `${Math.max(barPct > 0 ? 8 : 0, barPct)}%` }} />
                </div>
                <div className="learn-lab__nodes" aria-hidden="true">
                  {nodes.map((n) => (
                    <i
                      key={n}
                      className={`learn-lab__node${n < row ? ' is-done' : ''}${n === row ? ' is-now' : ''}`}
                    />
                  ))}
                </div>
              </div>
              <p className="learn-lab__bar-note">
                {hits} {hits === 1 ? 'acierto' : 'aciertos'} en esta run
              </p>
            </header>

            <div className="learn-lab__stage" key={enterKey}>
              <div
                className={`learn-lab__console${isCorrectReveal ? ' is-hit' : ''}${phase === 'hint' ? ' is-miss' : ''}`}
                aria-live="polite"
              >
                <span className="learn-lab__console-glow" aria-hidden="true" />
                <div className="learn-lab__lumo-peek" aria-hidden="true">
                  <Lumo state={lumo.state} intensity={lumo.intensity} size="sm" label="Lumo" />
                </div>

                <p className="learn-lab__eyebrow">
                  {row === 1 ? `1 grupo de ${table}` : `${row} grupos de ${table}`}
                </p>

                <div className={`learn-lab__equation${isCorrectReveal ? ' is-reveal' : ''}`}>
                  <span className="learn-lab__fact">
                    {table} × {row}
                  </span>
                  <span className="learn-lab__eq" aria-hidden="true">
                    =
                  </span>
                  <strong
                    className={`learn-lab__result${isCorrectReveal ? ' is-on' : ' is-pulse'}`}
                  >
                    {isCorrectReveal ? product : '?'}
                  </strong>
                </div>

                {praise ? (
                  <p className="learn-lab__praise" key={`${praise}-${burstKey}`}>
                    {praise}
                    {xpPop > 0 && praise !== '+10 XP' ? (
                      <span className="learn-lab__xp-pop">+{xpPop} XP</span>
                    ) : null}
                  </p>
                ) : null}

                {hint && !praise ? (
                  <div className="learn-lab__lumo-line" aria-live="polite">
                    <p className="learn-lab__tip">{hint}</p>
                  </div>
                ) : null}

                <div
                  className={`learn-lab__groups${product > 40 ? ' is-compact' : ''}${
                    phase === 'hint' || phase === 'reveal' ? ' is-lit' : ''
                  }`}
                  aria-hidden="true"
                >
                  {Array.from({ length: row }, (_, g) => (
                    <div
                      key={g}
                      className="learn-lab__group"
                      style={{ animationDelay: `${Math.min(g, 8) * 35}ms` }}
                    >
                      {Array.from({ length: table }, (_, u) => (
                        <span
                          key={u}
                          className="learn-lab__chip"
                          style={{ animationDelay: `${Math.min(g * table + u, 28) * 14}ms` }}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                {isCorrectReveal ? (
                  <div className="learn-lab__sparks" key={burstKey} aria-hidden="true">
                    {Array.from({ length: 8 }, (_, i) => (
                      <span key={i} className="learn-lab__spark" style={{ ['--i' as string]: i }} />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="learn-lab__answers">
              <AnswerGrid
                options={options}
                disabled={locked}
                correctValue={product}
                selectedValue={selected}
                reveal={isCorrectReveal || isWrongFlash}
                showCorrectAnswer={isCorrectReveal}
                bounceCorrect={isCorrectReveal}
                shakeWrong={isWrongFlash}
                onSelect={onSelect}
              />
            </div>

            <div className="learn-lab__nav">
              <button
                type="button"
                className="learn-lab__nav-btn"
                disabled={!canPrev}
                onClick={goPrev}
              >
                <span aria-hidden="true">←</span> Anterior
              </button>
              <button type="button" className="learn-lab__nav-btn learn-lab__nav-btn--exit" onClick={requestExit}>
                <span aria-hidden="true">✕</span> Salir
              </button>
            </div>
          </>
        )}
      </section>

      <ConfirmDialog
        open={exitOpen}
        title="¿Salir de la run?"
        body="Si sales ahora, se pierde el progreso de esta run."
        confirmLabel="Salir"
        cancelLabel="Seguir"
        onConfirm={() => {
          setExitOpen(false)
          navigate('/missions/mates/tables/modes')
        }}
        onCancel={() => setExitOpen(false)}
      />
    </AppShell>
  )
}
