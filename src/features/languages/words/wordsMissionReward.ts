import { buildActivityStatsDelta } from '@/achievements/stats'
import { energyForMissionAttempt } from '@/daily/missionEnergy'
import { rewardMatrix, sessionXpFromCorrects } from '@/config/rewardMatrix'
import { newId } from '@/progress/repository'
import type { MissionOfDayState } from '@/progress/PlayContext'

type GrantFn = (input: {
  sessionId: string
  requestedPoints: number
  mode: string
  correct: number
  wrong: number
  xpEarned: number
  claimDailyChallenge: boolean
  statsDelta: ReturnType<typeof buildActivityStatsDelta>
}) => void

/** Acredita cupo de misión «Palabras» + energía/XP al cerrar una ronda. */
export function grantWordsMissionReward(opts: {
  correct: number
  total: number
  modeLabel: string
  playerId: number | null
  startedAtMs: number
  recordProgress: (key: 'words', amount?: number) => void
  grantActivityEnergy: GrantFn
  consumeMissionOfDay: () => MissionOfDayState | null
}): void {
  const { correct, total } = opts
  if (correct <= 0) return
  const units = Math.min(2, correct)
  const energy = energyForMissionAttempt('words', units, opts.playerId)
  const dailyChallenge = opts.consumeMissionOfDay()
  if (!dailyChallenge) opts.recordProgress('words', units)
  const playSeconds = Math.max(1, Math.round((Date.now() - opts.startedAtMs) / 1000))
  opts.grantActivityEnergy({
    sessionId: newId('words'),
    requestedPoints: dailyChallenge ? 0 : energy,
    mode: opts.modeLabel.slice(0, 16),
    correct,
    wrong: Math.max(0, total - correct),
    xpEarned: sessionXpFromCorrects(correct, rewardMatrix.words.xpPerCorrect),
    claimDailyChallenge: Boolean(dailyChallenge),
    statsDelta: buildActivityStatsDelta({
      feature: 'words',
      mode: opts.modeLabel,
      correct,
      total,
      playSeconds,
    }),
  })
}
