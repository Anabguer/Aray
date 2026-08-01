import { useEffect, useRef, useState } from 'react'
import {
  detectMicroCelebrate,
  MICRO_CELEBRATE_MS,
  MICRO_CELEBRATE_MS_REDUCED,
  type MicroCelebrateEvent,
} from '@/run/microCelebrate'
import { prefersReducedMotion } from '@/run/answerFx'
import './micro-celebrate.css'

/** Toast breve al alcanzar hitos de racha. No bloquea input. */
export function useMicroCelebrate(streak: number): MicroCelebrateEvent | null {
  const [event, setEvent] = useState<MicroCelebrateEvent | null>(null)
  const prevStreak = useRef(0)
  const sessionBest = useRef(0)

  useEffect(() => {
    const prev = prevStreak.current
    const bestBefore = sessionBest.current
    const hit = detectMicroCelebrate(prev, streak, bestBefore)
    prevStreak.current = streak
    if (streak > sessionBest.current) sessionBest.current = streak
    if (!hit) return

    setEvent(hit)
    const ms = prefersReducedMotion() ? MICRO_CELEBRATE_MS_REDUCED : MICRO_CELEBRATE_MS
    const t = window.setTimeout(() => setEvent(null), ms)
    return () => window.clearTimeout(t)
  }, [streak])

  return event
}

export function MicroCelebrateBanner({ event }: { event: MicroCelebrateEvent | null }) {
  if (!event) return null
  return (
    <div
      className={`micro-celebrate micro-celebrate--${event.kind}`}
      role="status"
      aria-live="polite"
    >
      <span className="micro-celebrate__msg">{event.message}</span>
    </div>
  )
}
