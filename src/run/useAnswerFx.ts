import { useCallback, useRef, useState } from 'react'
import {
  buildRunFx,
  COMBO_MIN,
  type FxKind,
  type RunFx,
} from '@/run/answerFx'
import { soundEngine } from '@/sound/soundEngine'

export function useAnswerFx() {
  const [fx, setFx] = useState<RunFx | null>(null)
  const [lumoBoost, setLumoBoost] = useState(false)
  const lastKindRef = useRef<FxKind | null>(null)
  const lastHitMsgRef = useRef<string | null>(null)
  const lastMissMsgRef = useRef<string | null>(null)

  const clearFx = useCallback(() => {
    setFx(null)
    setLumoBoost(false)
  }, [])

  const spawn = useCallback(
    (input: {
      tone: 'hit' | 'miss'
      optionIndex?: number
      nextStreak: number
      xpGranted?: number
    }) => {
      const next = buildRunFx({
        ...input,
        lastKind: lastKindRef.current,
        lastHitMsg: lastHitMsgRef.current,
        lastMissMsg: lastMissMsgRef.current,
      })
      lastKindRef.current = next.kind
      if (input.tone === 'hit') lastHitMsgRef.current = next.message
      else lastMissMsgRef.current = next.message
      setFx(next)
      setLumoBoost(next.kind === 'bubble' || input.tone === 'hit')
      if (input.tone === 'hit' && input.nextStreak >= COMBO_MIN) {
        window.setTimeout(() => soundEngine.play('points-earned', { volume: 0.35 }), 90)
      }
      return next
    },
    [],
  )

  return { fx, lumoBoost, spawn, clearFx, setLumoBoost }
}

export { COMBO_MIN }
