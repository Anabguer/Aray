import { useCallback, useEffect, useRef, useState } from 'react'
import { lumoMessageForState } from '@/config/lumoMessages'
import {
  reactionFromAnswer,
  type LumoIntensity,
  type LumoReactionConfig,
  type LumoState,
} from '@/lumo/types'

export function useLumoController(initial: LumoState = 'idle') {
  const [state, setState] = useState<LumoState>(initial)
  const [intensity, setIntensity] = useState<LumoIntensity>(0)
  const [message, setMessage] = useState<string | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const timerRef = useRef<number | null>(null)
  const generationRef = useRef(0)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReducedMotion(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const settle = useCallback((next: LumoState = 'idle') => {
    setState(next)
    setIntensity(0)
    if (next === 'idle' || next === 'thinking') setMessage(null)
  }, [])

  const playReaction = useCallback(
    (config: LumoReactionConfig) => {
      generationRef.current += 1
      const gen = generationRef.current
      clearTimer()
      setState(config.state)
      setIntensity(config.intensity)
      const msg = config.message ?? lumoMessageForState(config.state, config.intensity >= 3 ? 5 : config.intensity >= 2 ? 3 : 1)
      setMessage(msg)

      const duration = reducedMotion ? Math.min(200, config.durationMs) : config.durationMs
      if (duration <= 0) return

      timerRef.current = window.setTimeout(() => {
        if (generationRef.current !== gen) return
        settle(config.state === 'celebration' ? 'idle' : 'thinking')
      }, duration)
    },
    [reducedMotion, settle],
  )

  const reactToAnswer = useCallback(
    (opts: {
      correct: boolean
      streak: number
      personalBest?: boolean
      dailyComplete?: boolean
      goalComplete?: boolean
    }) => {
      playReaction(reactionFromAnswer(opts))
    },
    [playReaction],
  )

  const setThinking = useCallback(() => {
    generationRef.current += 1
    clearTimer()
    setState('thinking')
    setIntensity(0)
    setMessage(null)
  }, [])

  const celebrate = useCallback(
    (reason: 'record' | 'daily' | 'goal' | 'streak10' = 'record') => {
      playReaction({
        state: 'celebration',
        intensity: 4,
        durationMs: reducedMotion ? 200 : 1800,
        message:
          reason === 'daily'
            ? lumoMessageForState('celebration', 10)
            : reason === 'goal'
              ? '¡Meta conseguida! Pendiente de validar por el adulto'
              : lumoMessageForState('celebration', 10),
      })
    },
    [playReaction, reducedMotion],
  )

  useEffect(() => () => clearTimer(), [])

  return {
    state,
    intensity,
    message,
    reducedMotion,
    playReaction,
    reactToAnswer,
    setThinking,
    celebrate,
    settle,
  }
}
