import { useEffect, useId, useMemo } from 'react'
import { usePrefersReducedMotion } from '@/feedback/usePrefersReducedMotion'
import { SessionXpBar } from '@/feedback/SessionXpBar'

export type TableCompleteInfo = {
  perfect: boolean
  tableNumber?: number | null
  xpEarned: number
  /** XP total del jugador tras aplicar la sesión. */
  totalXpAfter: number
  unlockLabel?: string | null
  leveledUp?: boolean
  newLevel?: number
}

type Props = {
  open: boolean
  info: TableCompleteInfo | null
  onContinue: () => void
}

/** Celebración breve al completar una tabla (Entrena / Empareja). */
export function TableCompleteCelebration({ open, info, onContinue }: Props) {
  const reduced = usePrefersReducedMotion()
  const titleId = useId()
  const confetti = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: 8 + ((i * 17) % 84),
        delay: (i % 6) * 40,
        dur: 900 + (i % 5) * 120,
        hue: (i * 47) % 360,
      })),
    [],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onContinue()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onContinue])

  if (!open || !info) return null

  const title = info.perfect ? '¡TABLA DOMADA!' : '¡Tabla completada!'

  return (
    <div className="table-complete" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className={`table-complete__card${info.perfect ? ' is-perfect' : ''}`}>
        {info.perfect && !reduced ? (
          <div className="table-complete__confetti" aria-hidden="true">
            {confetti.map((c) => (
              <span
                key={c.id}
                className="table-complete__piece"
                style={{
                  left: `${c.left}%`,
                  animationDelay: `${c.delay}ms`,
                  animationDuration: `${c.dur}ms`,
                  background: `hsl(${c.hue} 85% 62%)`,
                }}
              />
            ))}
          </div>
        ) : null}

        {info.tableNumber != null ? (
          <div
            className={`table-complete__halo${info.perfect ? ' is-perfect' : ''}`}
            aria-hidden="true"
          >
            <span className="table-complete__num">{info.tableNumber}</span>
          </div>
        ) : null}

        {info.perfect ? (
          <p className="table-complete__medal" aria-hidden="true">
            ★
          </p>
        ) : null}

        <h2 id={titleId} className="table-complete__title">
          {title}
        </h2>

        {info.xpEarned > 0 ? (
          <p className="table-complete__xp" role="status">
            +{info.xpEarned} XP
          </p>
        ) : null}

        <div className="table-complete__bar">
          <SessionXpBar totalXp={info.totalXpAfter} highlightGain={info.xpEarned} />
        </div>

        {info.leveledUp && info.newLevel ? (
          <p className="table-complete__levelup" role="status">
            ¡NIVEL SUPERADO! Ahora eres nivel {info.newLevel}
          </p>
        ) : null}

        {info.unlockLabel ? (
          <p className="table-complete__unlock" role="status">
            Desbloqueado: {info.unlockLabel}
          </p>
        ) : null}

        <button type="button" className="btn btn-primary btn-block table-complete__btn" onClick={onContinue}>
          CONTINUAR
        </button>
      </div>
    </div>
  )
}

type LevelUpProps = {
  open: boolean
  level: number
  unlockLabel?: string | null
  onDone?: () => void
}

/** Celebración distinta al subir de nivel (no bloquea el flujo si no hay callback). */
export function LevelUpCelebration({ open, level, unlockLabel, onDone }: LevelUpProps) {
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => onDone?.(), reduced ? 900 : 1600)
    return () => window.clearTimeout(t)
  }, [open, onDone, reduced])

  if (!open) return null

  return (
    <div className="level-up-toast" role="status" aria-live="assertive">
      <p className="level-up-toast__title">¡NIVEL SUPERADO!</p>
      <p className="level-up-toast__level">Nivel {level}</p>
      {unlockLabel ? <p className="level-up-toast__unlock">Desbloqueado: {unlockLabel}</p> : null}
    </div>
  )
}
