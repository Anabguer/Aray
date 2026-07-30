import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { MuteToggle } from '@/components/quiz/QuizWidgets'
import { StreakBadge } from '@/feedback/AnswerFx'
import { SessionXpBar } from '@/feedback/SessionXpBar'
import {
  sessionLeveledUp,
  unlockLabelAfterSession,
} from '@/feedback/sessionOutcome'
import {
  TableCompleteCelebration,
  type TableCompleteInfo,
} from '@/feedback/TableCompleteCelebration'
import { matchSessionMeta } from '@/config/rewardGoal'
import { Lumo } from '@/lumo/Lumo'
import { useLumoController } from '@/lumo/useLumoController'
import {
  buildMatchPairs,
  buildMatchRounds,
  isCorrectMatch,
  MATCH_MAX_PER_ROUND,
  MATCH_WRONG_MESSAGE,
  matchHintForAttempt,
  shuffleProductsNotAligned,
} from '@/math/match'
import type { SessionAnswer, SessionResult } from '@/math/types'
import { usePlaySession } from '@/progress/PlayContext'
import { useProgress } from '@/progress/ProgressContext'
import { newId } from '@/progress/repository'
import { previewSessionLoad } from '@/reward/engine'
import { soundEngine } from '@/sound/soundEngine'

type Assignment = Record<string, number | null>
type Phase = 'playing' | 'roundComplete' | 'tableComplete' | 'victory'

const OP_COLORS = ['cyan', 'violet', 'lime', 'orange', 'coral'] as const
const PRODUCT_COLORS = ['sky', 'violet', 'lime', 'amber', 'coral'] as const
const WRONG_LOCK_MS = 420
const POP_ANIM_MS = 480

export function MatchScreen() {
  const { progress, applySession, setSoundMuted } = useProgress()
  const { selection, setLastResult, setActiveMode } = usePlaySession()
  const table = selection.tables[0] ?? 7
  const lumo = useLumoController('thinking')
  const sessionIdRef = useRef(newId('match'))
  const rewardedRef = useRef(false)
  const openedRef = useRef(false)
  const maxLoad = previewSessionLoad(progress, matchSessionMeta.maxRewardFromItems)

  const allPairs = useMemo(() => buildMatchPairs(table), [table])
  const rounds = useMemo(() => buildMatchRounds(allPairs, MATCH_MAX_PER_ROUND), [allPairs])

  const [roundIndex, setRoundIndex] = useState(0)
  const roundPairs = rounds[roundIndex] ?? []
  const isLastRound = roundIndex + 1 >= rounds.length

  const [phase, setPhase] = useState<Phase>('playing')
  const [products, setProducts] = useState<number[]>([])
  const [assignment, setAssignment] = useState<Assignment>({})
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set())
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [selectedOpId, setSelectedOpId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [missedIds, setMissedIds] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [poppingOpId, setPoppingOpId] = useState<string | null>(null)
  const [wrongOpId, setWrongOpId] = useState<string | null>(null)
  const [bounceProduct, setBounceProduct] = useState<number | null>(null)
  const [, setRoundMissed] = useState<Set<string>>(new Set())
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [victory, setVictory] = useState<SessionResult | null>(null)
  const [celebration, setCelebration] = useState<TableCompleteInfo | null>(null)

  const busyRef = useRef(false)
  const lockedRef = useRef<Set<string>>(new Set())
  const attemptCountsRef = useRef<Record<string, number>>({})

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    soundEngine.unlock()
    soundEngine.play('activity-open')
  }, [])

  useEffect(() => {
    const pairs = rounds[roundIndex] ?? []
    setProducts(shuffleProductsNotAligned(pairs))
    setAssignment(Object.fromEntries(pairs.map((p) => [p.id, null])))
    lockedRef.current = new Set()
    setLockedIds(new Set())
    attemptCountsRef.current = {}
    setSelectedProduct(null)
    setSelectedOpId(null)
    setFeedback(null)
    setPhase('playing')
    busyRef.current = false
    setBusy(false)
    setPoppingOpId(null)
    setWrongOpId(null)
    setBounceProduct(null)
    setRoundMissed(new Set())
    lumo.setThinking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex, table])

  const productColorByValue = useMemo(() => {
    const map = new Map<number, string>()
    products.forEach((value, i) => map.set(value, PRODUCT_COLORS[i % PRODUCT_COLORS.length]))
    return map
  }, [products])

  const usedProducts = new Set(
    Object.entries(assignment)
      .filter(([, v]) => v !== null)
      .map(([, v]) => v as number),
  )
  const poolProducts = products.filter((p) => !usedProducts.has(p))
  const lockedCount = lockedIds.size
  const remaining = Math.max(0, roundPairs.length - lockedCount)
  const foundGlobal =
    rounds.slice(0, roundIndex).reduce((n, r) => n + r.length, 0) + lockedCount

  const finishAll = useCallback(
    (finalMissed: Set<string>) => {
      if (rewardedRef.current) return null
      rewardedRef.current = true
      setActiveMode('match')
      const progressBefore = progress
      const answers: SessionAnswer[] = []
      for (const pair of allPairs) {
        const wasMiss = finalMissed.has(pair.id)
        if (wasMiss) {
          answers.push({
            fact: pair.fact,
            correct: false,
            selected: -1,
            elapsedMs: 0,
            attemptId: newId('ans'),
            firstTry: false,
          })
        }
        answers.push({
          fact: pair.fact,
          correct: true,
          selected: pair.product,
          elapsedMs: 0,
          attemptId: newId('ans'),
          firstTry: !wasMiss,
        })
      }
      const result = applySession({
        mode: 'match',
        tables: [table],
        answers,
        score: allPairs.length - finalMissed.size,
        bestStreak,
        sessionId: sessionIdRef.current,
        missedFacts: allPairs.filter((p) => finalMissed.has(p.id)).map((p) => p.fact),
      })
      setLastResult(result)

      const perfect = finalMissed.size === 0
      const { leveledUp, newLevel } = sessionLeveledUp(progressBefore.xp, result.xpEarned)
      const unlockLabel = unlockLabelAfterSession(progressBefore, [table], answers, result)
      soundEngine.play(perfect ? 'perfect-complete' : 'activity-complete')
      setCelebration({
        perfect,
        tableNumber: table,
        xpEarned: result.xpEarned,
        totalXpAfter: progressBefore.xp + result.xpEarned,
        unlockLabel,
        leveledUp,
        newLevel,
      })
      return result
    },
    [allPairs, applySession, bestStreak, progress, setActiveMode, setLastResult, table],
  )

  const tryAssign = useCallback(
    (opId: string, product: number) => {
      if (phase !== 'playing') return
      if (lockedRef.current.has(opId) || busyRef.current || rewardedRef.current) return
      const pair = roundPairs.find((p) => p.id === opId)
      if (!pair) return

      if (isCorrectMatch(pair, product)) {
        const nextLocked = new Set(lockedRef.current)
        nextLocked.add(opId)
        lockedRef.current = nextLocked
        setLockedIds(nextLocked)
        setAssignment((prev) => ({ ...prev, [opId]: product }))
        setSelectedProduct(null)
        setSelectedOpId(null)
        setFeedback('¡Pareja!')
        setPoppingOpId(opId)
        setStreak((s) => {
          const next = s + 1
          setBestStreak((b) => Math.max(b, next))
          return next
        })
        soundEngine.play('answer-correct')
        window.setTimeout(() => {
          setPoppingOpId((id) => (id === opId ? null : id))
        }, POP_ANIM_MS)

        if (nextLocked.size >= roundPairs.length) {
          lumo.reactToAnswer({ correct: true, streak: 5 })
          if (isLastRound) {
            lumo.celebrate('record')
            setPhase('tableComplete')
          } else {
            setPhase('roundComplete')
          }
        } else {
          lumo.reactToAnswer({ correct: true, streak: 2 })
        }
        return
      }

      const fails = (attemptCountsRef.current[opId] ?? 0) + 1
      attemptCountsRef.current = { ...attemptCountsRef.current, [opId]: fails }
      setRoundMissed((prev) => new Set(prev).add(opId))
      setMissedIds((prev) => {
        const next = new Set(prev)
        next.add(opId)
        return next
      })
      setSelectedProduct(null)
      setSelectedOpId(null)
      setStreak(0)
      const hint = matchHintForAttempt(table, pair.product, fails)
      setFeedback(hint ? `${MATCH_WRONG_MESSAGE} ${hint}.` : MATCH_WRONG_MESSAGE)
      setWrongOpId(opId)
      setBounceProduct(product)
      lumo.reactToAnswer({ correct: false, streak: 0 })
      soundEngine.play('answer-wrong')
      busyRef.current = true
      setBusy(true)
      window.setTimeout(() => {
        busyRef.current = false
        setBusy(false)
        setWrongOpId((id) => (id === opId ? null : id))
        setBounceProduct((p) => (p === product ? null : p))
      }, WRONG_LOCK_MS)
    },
    [isLastRound, lumo, phase, roundPairs, table],
  )

  function goNextRound() {
    if (phase !== 'roundComplete') return
    setRoundIndex((i) => i + 1)
  }

  function onFinish() {
    if (phase !== 'tableComplete' || rewardedRef.current) return
    const result = finishAll(missedIds)
    if (result) {
      setVictory(result)
    }
  }

  function onContinueCelebration() {
    setCelebration(null)
    setPhase('victory')
  }

  function onProductClick(product: number) {
    if (busy || phase !== 'playing') return
    soundEngine.unlock()
    if (selectedOpId) {
      tryAssign(selectedOpId, product)
      return
    }
    setSelectedProduct((prev) => (prev === product ? null : product))
    soundEngine.play('ui-click')
  }

  function onOpClick(opId: string) {
    if (lockedRef.current.has(opId) || busy || phase !== 'playing') return
    soundEngine.unlock()
    if (selectedProduct !== null) {
      tryAssign(opId, selectedProduct)
      return
    }
    setSelectedOpId((prev) => (prev === opId ? null : opId))
    soundEngine.play('ui-click')
  }

  function replay() {
    rewardedRef.current = false
    sessionIdRef.current = newId('match')
    setRoundIndex(0)
    setMissedIds(new Set())
    setStreak(0)
    setBestStreak(0)
    setVictory(null)
    setCelebration(null)
    setPhase('playing')
  }

  const progressPct = Math.round((foundGlobal / Math.max(1, allPairs.length)) * 100)

  return (
    <AppShell
      title="EMPAREJA"
      showBack
      backTo="/missions/mates/tables/modes"
      trailing={
        <MuteToggle muted={progress.soundMuted} onToggle={() => setSoundMuted(!progress.soundMuted)} />
      }
    >
      <section className={`match-arena${celebration ? ' is-dimmed' : ''}`} aria-label="Minijuego Empareja">
        <SessionXpBar totalXp={progress.xp} compact className="play-screen__xp" />
        {phase === 'victory' && victory && !celebration ? (
          <div className="match-victory" role="status">
            <Lumo state="celebration" intensity={4} size="md" />
            <h2 className="match-victory__title">¡Tabla emparejada!</h2>
            <p className="match-victory__summary">
              {allPairs.length - missedIds.size}/{allPairs.length} a la primera
              {bestStreak > 1 ? ` · Racha ${bestStreak}` : ''}
            </p>
            <ul className="match-victory__rewards">
              <li>+{victory.xpEarned} XP</li>
              <li>+{victory.coinsEarned} monedas</li>
              <li>+{victory.rewardPointsEarned} energía</li>
            </ul>
            <div className="match-victory__actions">
              <button type="button" className="btn btn-primary btn-block" onClick={replay}>
                JUGAR OTRA VEZ
              </button>
              <Link to="/missions/mates/tables/modes" className="btn btn-secondary btn-block">
                ELEGIR OTRO MODO
              </Link>
              <Link to="/" className="btn btn-ghost btn-block">
                LOBBY
              </Link>
            </div>
          </div>
        ) : (
          <>
            <header className="match-hud">
              <div className="match-hud__row">
                <p className="match-hud__table">Tabla del {table}</p>
                <p className="match-hud__round">
                  Ronda {roundIndex + 1}/{rounds.length}
                </p>
              </div>
              <div
                className="match-hud__bar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={allPairs.length}
                aria-valuenow={foundGlobal}
                aria-label={`Parejas: ${foundGlobal} de ${allPairs.length}`}
              >
                <span style={{ width: `${Math.max(8, progressPct)}%` }} />
              </div>
              <div className="match-hud__stats">
                <span>
                  Encontradas <strong>{lockedCount}</strong>
                </span>
                <span>
                  Restan <strong>{remaining}</strong>
                </span>
                {streak > 0 ? <StreakBadge streak={streak} /> : <span className="match-hud__energy">Hasta ⚡{maxLoad}</span>}
              </div>
            </header>

            <div className="match-arena__guide" aria-live="polite">
              <Lumo state={lumo.state} intensity={lumo.intensity} size="sm" />
              <p>
                {selectedProduct !== null || selectedOpId
                  ? 'Toca la pareja'
                  : 'Elige una ficha y su pareja'}
              </p>
            </div>

            <div className="match-board match-board--arena">
              <ul className="match-ops" role="list" aria-label="Operaciones">
                {roundPairs.map((pair, i) => {
                  const locked = lockedIds.has(pair.id)
                  const value = assignment[pair.id]
                  const color = OP_COLORS[i % OP_COLORS.length]
                  const classes = ['match-tile', 'match-tile--op', `match-tile--${color}`]
                  if (locked) classes.push('is-locked')
                  if (selectedOpId === pair.id) classes.push('is-selected')
                  if (selectedProduct !== null && !locked) classes.push('is-target')
                  if (poppingOpId === pair.id) classes.push('is-pop')
                  if (wrongOpId === pair.id) classes.push('is-wrong')

                  return (
                    <li key={pair.id}>
                      <button
                        type="button"
                        className={classes.join(' ')}
                        disabled={locked || busy || phase !== 'playing'}
                        aria-pressed={selectedOpId === pair.id}
                        aria-label={
                          locked
                            ? `${pair.label} = ${value}, resuelta`
                            : `${pair.label}`
                        }
                        onClick={() => onOpClick(pair.id)}
                      >
                        <span className="match-tile__kind">Op</span>
                        <span className="match-tile__value">{pair.label}</span>
                        {locked ? <span className="match-tile__ok" aria-hidden="true" /> : null}
                      </button>
                    </li>
                  )
                })}
              </ul>

              {phase === 'playing' ? (
                <ul className="match-products" role="list" aria-label="Resultados">
                  {poolProducts.map((product) => {
                    const color = productColorByValue.get(product) ?? PRODUCT_COLORS[0]
                    const classes = ['match-tile', 'match-tile--result', `match-tile--${color}`]
                    if (selectedProduct === product) classes.push('is-selected')
                    if (bounceProduct === product) classes.push('is-bounce')

                    return (
                      <li key={`pool-${product}`}>
                        <button
                          type="button"
                          className={classes.join(' ')}
                          aria-pressed={selectedProduct === product}
                          aria-label={`Resultado ${product}`}
                          disabled={busy}
                          onClick={() => onProductClick(product)}
                        >
                          <span className="match-tile__kind">=</span>
                          <span className="match-tile__value">{product}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </div>

            <div className="match-arena__live" aria-live="assertive">
              {feedback ? <p className={`match-toast${feedback.startsWith('¡') ? ' is-ok' : ' is-bad'}`}>{feedback}</p> : null}
            </div>

            {phase === 'roundComplete' ? (
              <div className="match-panel" role="status">
                <p className="match-panel__title">Ronda lista</p>
                <button type="button" className="btn btn-primary btn-block" onClick={goNextRound}>
                  Siguiente ronda
                </button>
              </div>
            ) : null}

            {phase === 'tableComplete' ? (
              <div className="match-panel" role="status">
                <p className="match-panel__title">¡Todas las parejas!</p>
                <button type="button" className="btn btn-primary btn-block" onClick={onFinish}>
                  Ver recompensas
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>
      <TableCompleteCelebration
        open={Boolean(celebration)}
        info={celebration}
        onContinue={onContinueCelebration}
      />
    </AppShell>
  )
}
