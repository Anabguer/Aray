import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import {
  AnswerGrid,
  ConfirmDialog,
  useKeyboardAnswers,
} from '@/components/quiz/QuizWidgets'
import { MAX_MULTIPLIER, MIX_TABLES } from '@/config/playConfig'
import { sessionXpEarned, xpDeltaForAnswer } from '@/feedback/xpPreview'
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
import { MicroCelebrateBanner, useMicroCelebrate } from '@/run/microCelebrateUi'
import { launchTablesRandomMission } from '@/math/launchRandomMission'

type LearnPhase = 'ask' | 'hint' | 'reveal' | 'done'
type FxKind = 'bubble' | 'stamp' | 'near' | 'band'
type StampSlot = 'a' | 'b' | 'c' | 'd'

type LearnFx = {
  kind: FxKind
  tone: 'hit' | 'miss'
  message: string
  stamp?: string
  slot?: StampSlot
  optionIndex?: number
  xp?: number
  combo?: number
  key: number
}

const HIT_MESSAGES = [
  '¡Esa estaba regalada!',
  'Lumo.exe impresionado.',
  '¡PUM! Directo.',
  'Modo bestia activado.',
  'Ni has despeinado el avatar.',
  '¡Combo limpio!',
  'La tabla está temblando.',
  'Demasiado fácil para ti.',
] as const

const HIT_MESSAGES_MOBILE = [
  '¡Regalada!',
  'Lumo impresionado.',
  '¡PUM! Directo.',
  'Modo bestia.',
  '¡Combo limpio!',
  'Demasiado fácil.',
] as const

const MISS_MESSAGES = [
  'Buen intento, pequeño troll.',
  'Uy… esa hizo parkour.',
  'La respuesta se ha escondido.',
  'Casi. Lumo no ha visto nada.',
  'Glitch matemático. Otra vez.',
  'Te quiso trolear.',
  'Reintenta, que esta cae.',
  'Plot twist: esa no era.',
] as const

const MISS_MESSAGES_MOBILE = [
  'Buen intento, troll.',
  'Esa hizo parkour.',
  'Se ha escondido.',
  'Casi. Nada visto.',
  'Glitch. Otra vez.',
  'Te quiso trolear.',
  'Reintenta, cae.',
  'Plot twist.',
] as const

const STAMP_HITS = ['¡CRACK!', 'EZ', '¡PUM!', 'NICE'] as const
const STAMP_MISS = ['CASI, TROL', 'NOPE', 'GLITCH', '¿EH?'] as const
const STAMP_SLOTS: StampSlot[] = ['a', 'b', 'c', 'd']
const FX_DESKTOP: FxKind[] = ['bubble', 'stamp', 'near', 'band']
const FX_MOBILE: FxKind[] = ['bubble', 'near', 'band']
const COMBO_MIN = 2

function pickFromPool<T>(pool: readonly T[], avoid?: T | null): T {
  if (pool.length === 1) return pool[0]!
  const filtered = avoid == null ? [...pool] : pool.filter((x) => x !== avoid)
  const list = filtered.length > 0 ? filtered : [...pool]
  return list[Math.floor(Math.random() * list.length)]!
}

function isMobileFx(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 900px)').matches
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function LearnScreen() {
  const navigate = useNavigate()
  const {
    selection,
    consumeMissionOfDay,
    fromRandom,
    setSelection,
    setActiveMode,
    setPendingQueue,
    setLastResult,
    setFromRandom,
  } = usePlaySession()
  const { progress, applySession } = useProgress()
  const tables = selection.mix ? [...MIX_TABLES] : selection.tables.length ? selection.tables : [7]
  const lumo = useLumoController('thinking')
  const sessionIdRef = useRef(newId('learn'))
  const appliedRef = useRef(false)
  const answersRef = useRef<SessionAnswer[]>([])
  const lastFxKindRef = useRef<FxKind | null>(null)
  const lastHitMsgRef = useRef<string | null>(null)
  const lastMissMsgRef = useRef<string | null>(null)

  const [tableIndex, setTableIndex] = useState(0)
  const [row, setRow] = useState(1)
  const [phase, setPhase] = useState<LearnPhase>('ask')
  const [locked, setLocked] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [failedThisQuestion, setFailedThisQuestion] = useState(false)
  const [enterKey, setEnterKey] = useState(0)
  const [answers, setAnswers] = useState<SessionAnswer[]>([])
  const [hits, setHits] = useState(0)
  const [streak, setStreak] = useState(0)
  const micro = useMicroCelebrate(streak)
  const [xpEarned, setXpEarned] = useState(0)
  const [runPerfect, setRunPerfect] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const [burstKey, setBurstKey] = useState(0)
  const [fx, setFx] = useState<LearnFx | null>(null)
  const [lumoBoost, setLumoBoost] = useState(false)

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

  function clearFx() {
    setFx(null)
    setLumoBoost(false)
  }

  function resetAsk() {
    setPhase('ask')
    setLocked(false)
    setSelected(null)
    setFailedThisQuestion(false)
    clearFx()
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
    setStreak(0)
    setXpEarned(0)
    setRunPerfect(false)
    resetAsk()
  }

  function finishRun(finalAnswers: SessionAnswer[], finalHits: number) {
    let earned = 0
    if (!appliedRef.current && finalAnswers.length > 0) {
      appliedRef.current = true
      const mission = consumeMissionOfDay()
      const result = applySession({
        mode: 'learn',
        tables,
        answers: finalAnswers,
        score: finalHits,
        bestStreak: 0,
        sessionId: sessionIdRef.current,
        isMissionOfDay: Boolean(mission),
        missionCode: mission?.code,
      })
      earned = result.xpEarned
    } else {
      earned = sessionXpEarned('learn', finalAnswers)
    }
    setXpEarned(earned)
    setRunPerfect(finalHits === opTotal && finalAnswers.length > 0)
    setPhase('done')
    clearFx()
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

  function spawnFx(
    tone: 'hit' | 'miss',
    optionValue: number,
    nextStreak: number,
    xpGranted?: number,
  ) {
    const reduced = prefersReducedMotion()
    const mobile = isMobileFx()
    const pool = mobile ? FX_MOBILE : FX_DESKTOP
    const kind = pickFromPool(pool, lastFxKindRef.current)
    lastFxKindRef.current = kind

    const hitPool = mobile ? HIT_MESSAGES_MOBILE : HIT_MESSAGES
    const missPool = mobile ? MISS_MESSAGES_MOBILE : MISS_MESSAGES
    const message =
      tone === 'hit'
        ? pickFromPool(hitPool, lastHitMsgRef.current)
        : pickFromPool(missPool, lastMissMsgRef.current)
    if (tone === 'hit') lastHitMsgRef.current = message
    else lastMissMsgRef.current = message

    const optionIndex = Math.max(0, options.indexOf(optionValue))
    const hasCombo = tone === 'hit' && nextStreak >= COMBO_MIN
    const stamp =
      kind === 'stamp'
        ? hasCombo
          ? `¡Combo ×${nextStreak}!`
          : pickFromPool(tone === 'hit' ? STAMP_HITS : STAMP_MISS)
        : hasCombo && kind === 'band'
          ? `¡Combo ×${nextStreak}!`
          : undefined

    const xp = tone === 'hit' && xpGranted != null && xpGranted > 0 ? xpGranted : undefined

    const next: LearnFx = {
      kind: reduced && kind === 'stamp' ? 'band' : kind,
      tone,
      message,
      stamp,
      slot: pickFromPool(STAMP_SLOTS),
      optionIndex,
      xp,
      combo: hasCombo ? nextStreak : undefined,
      key: Date.now(),
    }
    setFx(next)
    setLumoBoost(kind === 'bubble' || tone === 'hit')
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
        const prevAnswers = answersRef.current
        const nextAnswers = [...prevAnswers, answer]
        answersRef.current = nextAnswers
        setAnswers(nextAnswers)
        const nextHits = firstTry ? hits + 1 : hits
        if (firstTry) setHits(nextHits)
        const nextStreak = firstTry ? streak + 1 : 1
        setStreak(nextStreak)
        setPhase('reveal')
        setBurstKey((k) => k + 1)
        spawnFx('hit', value, nextStreak, xpDeltaForAnswer('learn', prevAnswers, answer))
        lumo.reactToAnswer({ correct: true, streak: nextStreak })
        soundEngine.play('answer-correct')
        if (nextStreak >= COMBO_MIN) {
          window.setTimeout(() => soundEngine.play('points-earned', { volume: 0.35 }), 90)
        }
        const delay = prefersReducedMotion() ? 700 : 950
        window.setTimeout(() => goNextOp(nextAnswers, nextHits), delay)
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
      setStreak(0)
      spawnFx('miss', value, 0)
      lumo.reactToAnswer({ correct: false, streak: 0 })
      soundEngine.play('answer-wrong')
      setPhase('hint')
      window.setTimeout(() => {
        setLocked(false)
        setSelected(null)
        setLumoBoost(false)
      }, prefersReducedMotion() ? 420 : 620)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run snapshot for timeout advance
    [phase, locked, product, failedThisQuestion, hits, streak, table, row, tableIndex, tables.length, lumo, options],
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

  const nodes = Array.from({ length: MAX_MULTIPLIER }, (_, i) => i + 1)

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
              <h2 className="learn-lab__done-title">¡TERMINADO!</h2>
            )}
            <p className="learn-lab__done-score">
              {hits}/{opTotal}
            </p>
            <p className="learn-lab__done-text">
              +{xpEarned} XP · {singleTable ? statusLabel : 'Mezcla'}
            </p>
            <p className="learn-lab__done-lumo">
              {runPerfect
                ? '¡Genial! Esa tabla ya es tuya.'
                : hits >= Math.ceil(opTotal * 0.8)
                  ? '¡Qué bien! Otra vez y la clavas.'
                  : 'Buen calentamiento. ¡A por la siguiente!'}
            </p>
            <div className="learn-lab__done-actions">
              {fromRandom ? (
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => {
                    launchTablesRandomMission(navigate, progress, {
                      setSelection,
                      setActiveMode,
                      setPendingQueue,
                      setLastResult,
                      setFromRandom,
                    })
                  }}
                >
                  OTRO RANDOM
                </button>
              ) : null}
              <button
                type="button"
                className={`btn btn-block${fromRandom ? ' btn-secondary' : ' btn-primary'}`}
                onClick={restartRun}
              >
                OTRA VEZ
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
                  <span className="learn-lab__table-run"> · EN JUEGO</span>
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
                {hits} {hits === 1 ? 'acierto' : 'aciertos'} en esta partida
                {streak >= COMBO_MIN ? ` · ¡Combo ×${streak}!` : ''}
              </p>
            </header>

            <div className="learn-lab__stage" key={enterKey} style={{ position: 'relative' }}>
              <MicroCelebrateBanner event={micro} />
              <div
                className={`learn-lab__console${isCorrectReveal ? ' is-hit' : ''}${phase === 'hint' ? ' is-miss' : ''}${
                  lumoBoost ? ' is-lumo-up' : ''
                }`}
                aria-live="polite"
              >
                <span className="learn-lab__console-glow" aria-hidden="true" />
                <div
                  className={`learn-lab__lumo-peek${lumoBoost ? ' is-boost' : ''}${
                    fx?.tone === 'miss' && fx.kind === 'bubble' ? ' is-troll' : ''
                  }`}
                  aria-hidden="true"
                >
                  <Lumo state={lumo.state} intensity={lumo.intensity} size="sm" label="Lumo" />
                  {fx?.kind === 'bubble' ? (
                    <div className={`learn-lab__bubble learn-lab__bubble--${fx.tone}`} key={fx.key}>
                      <span className="learn-lab__bubble-msg">{fx.message}</span>
                      {fx.xp != null ? (
                        <span className="learn-lab__bubble-xp">+{fx.xp} XP</span>
                      ) : null}
                      {fx.combo != null ? (
                        <span className="learn-lab__bubble-combo">¡Combo ×{fx.combo}!</span>
                      ) : null}
                    </div>
                  ) : null}
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

                {fx?.kind === 'stamp' ? (
                  <p
                    className={`learn-lab__stamp learn-lab__stamp--${fx.slot} learn-lab__stamp--${fx.tone}`}
                    key={fx.key}
                  >
                    <span className="learn-lab__stamp-label">{fx.stamp ?? fx.message}</span>
                    {fx.xp != null ? <span className="learn-lab__stamp-xp">+{fx.xp} XP</span> : null}
                  </p>
                ) : null}

                {fx?.kind === 'band' ? (
                  <p className={`learn-lab__band learn-lab__band--${fx.tone}`} key={fx.key} role="status">
                    <span className="learn-lab__band-msg">{fx.stamp ?? fx.message}</span>
                    {fx.xp != null ? <span className="learn-lab__band-xp">+{fx.xp} XP</span> : null}
                  </p>
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
                nearFx={
                  fx?.kind === 'near' && typeof fx.optionIndex === 'number'
                    ? {
                        index: fx.optionIndex,
                        tone: fx.tone,
                        message: fx.message,
                        xp: fx.xp,
                        combo: fx.combo,
                      }
                    : null
                }
              />
            </div>

            <nav className="learn-lab__nav" aria-label="Navegación de la run">
              <button
                type="button"
                className="learn-lab__nav-btn learn-lab__nav-btn--prev"
                disabled={!canPrev}
                onClick={goPrev}
              >
                <svg className="learn-lab__nav-ico" viewBox="0 0 24 24" width="1.1em" height="1.1em" aria-hidden>
                  <path
                    d="M14.5 6.5 9 12l5.5 5.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.5 12H20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                    opacity="0.65"
                  />
                </svg>
                <span className="learn-lab__nav-label">ANTERIOR</span>
              </button>
              <button
                type="button"
                className="learn-lab__nav-btn learn-lab__nav-btn--exit"
                onClick={requestExit}
              >
                <svg className="learn-lab__nav-ico" viewBox="0 0 24 24" width="1.1em" height="1.1em" aria-hidden>
                  <path
                    d="M10 5H7.5A2.5 2.5 0 0 0 5 7.5v9A2.5 2.5 0 0 0 7.5 19H10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 12h8m0 0-2.6-2.6M20 12l-2.6 2.6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="learn-lab__nav-label learn-lab__nav-label--exit">SALIR</span>
                <span className="learn-lab__nav-label learn-lab__nav-label--exit-short">SALIR</span>
              </button>
            </nav>
          </>
        )}
      </section>

      <ConfirmDialog
        open={exitOpen}
        title="¿Sales ahora?"
        body="Si sales ahora, se pierde lo de esta partida."
        confirmLabel="SALIR"
        cancelLabel="SEGUIR JUGANDO"
        cancelIsPrimary
        onConfirm={() => {
          setExitOpen(false)
          navigate('/missions/mates/tables/modes')
        }}
        onCancel={() => setExitOpen(false)}
      />
    </AppShell>
  )
}
