import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { ModeIcon } from '@/components/ModeIcon'
import { FeedbackBanner, MuteToggle } from '@/components/quiz/QuizWidgets'
import { energyCopy, matchSessionMeta } from '@/config/rewardGoal'
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
import type { SessionAnswer } from '@/math/types'
import { usePlaySession } from '@/progress/PlayContext'
import { useProgress } from '@/progress/ProgressContext'
import { newId } from '@/progress/repository'
import { previewSessionLoad } from '@/reward/engine'
import { soundEngine } from '@/sound/soundEngine'

type Assignment = Record<string, number | null>
type Phase = 'playing' | 'roundComplete' | 'tableComplete'

const OP_COLORS = ['cyan', 'violet', 'lime', 'orange', 'coral'] as const
const PRODUCT_COLORS = ['sky', 'violet', 'lime', 'amber', 'coral'] as const
const WRONG_LOCK_MS = 400
const POP_ANIM_MS = 420

export function MatchScreen() {
  const navigate = useNavigate()
  const { progress, applySession, setSoundMuted } = useProgress()
  const { selection, setLastResult, setActiveMode } = usePlaySession()
  const table = selection.tables[0] ?? 7
  const lumo = useLumoController('thinking')
  const sessionIdRef = useRef(newId('match'))
  const rewardedRef = useRef(false)
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
  const [feedback, setFeedback] = useState<string | null>(null)
  const [missedIds, setMissedIds] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [poppingOpId, setPoppingOpId] = useState<string | null>(null)
  const [wrongOpId, setWrongOpId] = useState<string | null>(null)
  const [bounceProduct, setBounceProduct] = useState<number | null>(null)
  const [showHelp, setShowHelp] = useState(true)
  const [roundMissed, setRoundMissed] = useState<Set<string>>(new Set())
  const [roundAttempts, setRoundAttempts] = useState(0)

  // Anti-duplicación: los refs reflejan el estado de forma síncrona para evitar
  // dobles asignaciones cuando llegan eventos casi simultáneos (drop + click, doble tap…).
  const busyRef = useRef(false)
  const lockedRef = useRef<Set<string>>(new Set())
  const attemptCountsRef = useRef<Record<string, number>>({})

  useEffect(() => {
    const t = window.setTimeout(() => setShowHelp(false), 4000)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    const pairs = rounds[roundIndex] ?? []
    setProducts(shuffleProductsNotAligned(pairs))
    setAssignment(Object.fromEntries(pairs.map((p) => [p.id, null])))
    lockedRef.current = new Set()
    setLockedIds(new Set())
    attemptCountsRef.current = {}
    setSelectedProduct(null)
    setFeedback(null)
    setPhase('playing')
    busyRef.current = false
    setBusy(false)
    setPoppingOpId(null)
    setWrongOpId(null)
    setBounceProduct(null)
    setRoundMissed(new Set())
    setRoundAttempts(0)
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

  const finishAll = useCallback(
    (finalMissed: Set<string>) => {
      if (rewardedRef.current) return
      rewardedRef.current = true
      setActiveMode('match')
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
        bestStreak: 0,
        sessionId: sessionIdRef.current,
        missedFacts: allPairs.filter((p) => finalMissed.has(p.id)).map((p) => p.fact),
      })
      setLastResult(result)
      navigate('/missions/mates/tables/summary')
    },
    [allPairs, applySession, navigate, setActiveMode, setLastResult, table],
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
        setFeedback('¡Encaja!')
        setPoppingOpId(opId)
        soundEngine.play('correct')
        window.setTimeout(() => {
          setPoppingOpId((id) => (id === opId ? null : id))
        }, POP_ANIM_MS)

        if (nextLocked.size >= roundPairs.length) {
          lumo.reactToAnswer({ correct: true, streak: 5 })
          if (isLastRound) {
            lumo.celebrate('record')
            soundEngine.play('reward')
            setPhase('tableComplete')
          } else {
            soundEngine.play('correct')
            setPhase('roundComplete')
          }
        } else {
          lumo.reactToAnswer({ correct: true, streak: 2 })
        }
        return
      }

      const fails = (attemptCountsRef.current[opId] ?? 0) + 1
      attemptCountsRef.current = { ...attemptCountsRef.current, [opId]: fails }
      setRoundAttempts((n) => n + 1)
      setRoundMissed((prev) => new Set(prev).add(opId))
      setMissedIds((prev) => {
        const next = new Set(prev)
        next.add(opId)
        return next
      })
      setSelectedProduct(null)
      const hint = matchHintForAttempt(table, pair.product, fails)
      setFeedback(hint ? `${MATCH_WRONG_MESSAGE} ${hint}.` : MATCH_WRONG_MESSAGE)
      setWrongOpId(opId)
      setBounceProduct(product)
      lumo.reactToAnswer({ correct: false, streak: 0 })
      soundEngine.play('wrong')
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
    finishAll(missedIds)
  }

  function onProductClick(product: number) {
    if (busy || phase !== 'playing') return
    setSelectedProduct((prev) => (prev === product ? null : product))
  }

  function onOpClick(opId: string) {
    if (lockedRef.current.has(opId) || busy || phase !== 'playing') return
    if (selectedProduct === null) return
    tryAssign(opId, selectedProduct)
  }

  const correctedLabels = roundPairs
    .filter((p) => roundMissed.has(p.id))
    .map((p) => p.label)
    .join(', ')

  return (
    <AppShell
      title="Empareja"
      showBack
      backTo="/missions/mates/tables/modes"
      trailing={
        <MuteToggle muted={progress.soundMuted} onToggle={() => setSoundMuted(!progress.soundMuted)} />
      }
    >
      <section className="match-screen">
        <header className="match-header">
          <ModeIcon mode="empareja" className="match-header__icon" />
          <div>
            <h1 className="match-header__title">Tabla del {table}</h1>
            <p className="match-header__meta" aria-live="polite">
              {`Ronda ${roundIndex + 1} de ${rounds.length} · ${lockedCount}/${roundPairs.length} parejas`}
            </p>
            <p className="match-header__energy">{energyCopy.sessionMax(maxLoad)}</p>
          </div>
        </header>

        <div className="play-stage match-stage">
          <Lumo state={lumo.state} intensity={lumo.intensity} size="sm" />
          <p className="match-guide" aria-live="polite">
            {showHelp
              ? 'Arrastra, toca o usa teclado para encajar cada resultado.'
              : selectedProduct !== null
                ? 'Elige la operación correcta.'
                : 'Elige un resultado y encájalo.'}
          </p>
        </div>

        {selectedProduct !== null && phase === 'playing' ? (
          <p className="match-selection" aria-live="polite">
            Resultado seleccionado: <strong>{selectedProduct}</strong>
          </p>
        ) : null}

        <div className="match-board">
          <ul className="match-ops" role="list" aria-label="Operaciones">
            {roundPairs.map((pair, i) => {
              const locked = lockedIds.has(pair.id)
              const value = assignment[pair.id]
              const isTarget = phase === 'playing' && selectedProduct !== null && !locked
              const color = OP_COLORS[i % OP_COLORS.length]
              const classes = ['match-op', `match-op--${color}`]
              if (locked) classes.push('is-locked')
              if (isTarget) classes.push('is-target')
              if (poppingOpId === pair.id) classes.push('is-pop')
              if (wrongOpId === pair.id) classes.push('is-wrong')

              return (
                <li key={pair.id}>
                  <button
                    type="button"
                    className={classes.join(' ')}
                    disabled={locked || busy || phase !== 'playing'}
                    aria-label={
                      locked
                        ? `${pair.label} = ${value}, correcta`
                        : value !== null
                          ? `${pair.label}, asociado ${value}`
                          : `${pair.label}, vacío. Arrastra aquí`
                    }
                    onClick={() => onOpClick(pair.id)}
                    onDragOver={(e) => {
                      if (!locked && phase === 'playing') e.preventDefault()
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      const product = Number(e.dataTransfer.getData('text/plain'))
                      if (!Number.isNaN(product)) tryAssign(pair.id, product)
                    }}
                  >
                    <span className="match-op__label">{pair.label}</span>
                    <span className={`match-op__slot${locked ? '' : ' match-op__slot--empty'}`}>
                      {locked ? (
                        <>
                          <span className="match-op__value">{value}</span>
                          <span className="match-op__check" aria-hidden="true">
                            ✓
                          </span>
                        </>
                      ) : (
                        <span className="match-op__placeholder">Arrastra aquí</span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          {phase === 'playing' ? (
            <ul className="match-products" role="list" aria-label="Resultados disponibles">
              {poolProducts.map((product) => {
                const color = productColorByValue.get(product) ?? PRODUCT_COLORS[0]
                const classes = ['match-product', `match-product--${color}`]
                if (selectedProduct === product) classes.push('is-selected')
                if (bounceProduct === product) classes.push('is-bounce')

                return (
                  <li key={`pool-${product}`}>
                    <button
                      type="button"
                      draggable={!busy}
                      className={classes.join(' ')}
                      aria-pressed={selectedProduct === product}
                      aria-label={
                        selectedProduct === product
                          ? `Resultado ${product} seleccionado`
                          : `Resultado ${product}`
                      }
                      disabled={busy}
                      onClick={() => onProductClick(product)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onProductClick(product)
                        }
                      }}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', String(product))
                        setSelectedProduct(product)
                      }}
                    >
                      {product}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>

        <div aria-live="assertive">
          {feedback ? (
            <FeedbackBanner
              tone={feedback.startsWith('¡') ? 'ok' : feedback.startsWith('Ahí') ? 'bad' : 'info'}
              message={feedback}
            />
          ) : null}
        </div>

        {phase === 'roundComplete' ? (
          <div className="match-round-end" role="status" aria-live="polite">
            <p className="match-round-end__title">
              ¡Ronda completada! {lockedCount}/{roundPairs.length}
            </p>
            <p className="match-round-end__stats">
              Intentos fallidos: {roundAttempts}
              {correctedLabels ? ` · Con corrección: ${correctedLabels}` : ' · Sin correcciones'}
            </p>
            <button type="button" className="btn btn-primary btn-block" onClick={goNextRound}>
              Siguiente ronda
            </button>
          </div>
        ) : null}

        {phase === 'tableComplete' ? (
          <div className="match-round-end" role="status" aria-live="polite">
            <p className="match-round-end__title">
              ¡Tabla emparejada! {allPairs.length}/{allPairs.length}
            </p>
            <p className="match-round-end__stats">
              Intentos fallidos: {roundAttempts}
              {correctedLabels ? ` · Con corrección: ${correctedLabels}` : ' · Sin correcciones'}
            </p>
            <button type="button" className="btn btn-primary btn-block" onClick={onFinish}>
              Ver resumen
            </button>
          </div>
        ) : null}

        <Link to="/missions/mates/tables/modes" className="btn btn-ghost btn-block">
          Salir
        </Link>
      </section>
    </AppShell>
  )
}
