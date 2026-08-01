import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react'
import { usePrefersReducedMotion } from '@/feedback/usePrefersReducedMotion'

type Particle = { id: number; x: number; y: number; delay: number; rot: number }

type Props = {
  /** Disparo de partículas (cambia de valor para reactivar). */
  burstKey: number
  active?: boolean
}

/** Estrellas/partículas breves (&lt;1s) sobre la zona de respuesta. */
export function AnswerBurst({ burstKey, active = true }: Props) {
  const reduced = usePrefersReducedMotion()
  const [particles, setParticles] = useState<Particle[]>([])
  const uid = useId()

  useEffect(() => {
    if (!active || reduced || burstKey <= 0) return
    const next: Particle[] = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: (i % 4) * 22 - 28 + (i % 3) * 4,
      y: Math.floor(i / 4) * -18 - 8,
      delay: i * 28,
      rot: (i * 37) % 360,
    }))
    setParticles(next)
    const t = window.setTimeout(() => setParticles([]), 720)
    return () => window.clearTimeout(t)
  }, [active, burstKey, reduced])

  if (reduced || particles.length === 0) return null

  return (
    <div className="answer-burst" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={`${uid}-${burstKey}-${p.id}`}
          className="answer-burst__star"
          style={{
            ['--bx' as string]: `${p.x}px`,
            ['--by' as string]: `${p.y}px`,
            ['--bd' as string]: `${p.delay}ms`,
            ['--br' as string]: `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  )
}

type FlyProps = {
  amount: number
  /** Clave para relanzar el vuelo. */
  flyKey: number
  /** Selector CSS del destino (barra XP). */
  targetSelector?: string
  onArrived?: () => void
}

/** “+N XP” que vuela hacia la barra real. */
export function XpFlyLabel({
  amount,
  flyKey,
  targetSelector = '.session-xp-bar__track',
  onArrived,
}: FlyProps) {
  const reduced = usePrefersReducedMotion()
  const [style, setStyle] = useState<CSSProperties | null>(null)
  const [visible, setVisible] = useState(false)
  const label = useMemo(() => (amount > 0 ? `+${amount} XP` : ''), [amount])

  useEffect(() => {
    if (flyKey <= 0 || amount <= 0) return
    setVisible(true)

    if (reduced) {
      const t = window.setTimeout(() => {
        setVisible(false)
        onArrived?.()
      }, 480)
      return () => window.clearTimeout(t)
    }

    setStyle({
      transform: 'translate(-50%, 0) scale(1)',
      opacity: 1,
    })

    const start = window.setTimeout(() => {
      const target = document.querySelector(targetSelector)
      const origin = document.querySelector('.xp-fly-anchor')
      if (!target || !origin) {
        onArrived?.()
        setVisible(false)
        return
      }
      const tRect = target.getBoundingClientRect()
      const oRect = origin.getBoundingClientRect()
      const dx = tRect.left + tRect.width * 0.7 - (oRect.left + oRect.width / 2)
      const dy = tRect.top + tRect.height / 2 - (oRect.top + oRect.height / 2)
      setStyle({
        transform: `translate(calc(-50% + ${dx}px), ${dy}px) scale(0.7)`,
        opacity: 0.15,
        transition: 'transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.55s ease',
      })
    }, 120)

    const end = window.setTimeout(() => {
      setVisible(false)
      setStyle(null)
      onArrived?.()
    }, 700)

    return () => {
      window.clearTimeout(start)
      window.clearTimeout(end)
    }
  }, [amount, flyKey, onArrived, reduced, targetSelector])

  if (!visible || !label) return null

  return (
    <span className="xp-fly-label" style={style ?? undefined} aria-live="polite">
      {label}
    </span>
  )
}

type StreakProps = {
  streak: number
}

/** Racha visual a partir de 3; no altera puntuación. */
export function StreakBadge({ streak }: StreakProps) {
  const reduced = usePrefersReducedMotion()
  const [displayStreak, setDisplayStreak] = useState(streak)
  const [shown, setShown] = useState(streak >= 3)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (streak >= 3) {
      setDisplayStreak(streak)
      setLeaving(false)
      setShown(true)
      return
    }
    if (!shown) return
    if (reduced) {
      setShown(false)
      return
    }
    setLeaving(true)
    const t = window.setTimeout(() => {
      setShown(false)
      setLeaving(false)
    }, 320)
    return () => window.clearTimeout(t)
  }, [reduced, shown, streak])

  if (!shown) return null

  return (
    <p
      className={`streak-badge${leaving ? ' is-leaving' : ''}${reduced ? ' is-static' : ''}`}
      role="status"
      aria-label={`Racha de ${displayStreak}`}
    >
      <span aria-hidden="true">🔥</span> ¡Racha ×{displayStreak}!
    </p>
  )
}
