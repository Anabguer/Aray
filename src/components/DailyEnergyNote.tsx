import { energyCopy, rewardGoalConfig } from '@/config/rewardGoal'
import { useProgress } from '@/progress/ProgressContext'
import { normalizeRewardCycles } from '@/reward/engine'

/** Aviso cuando la barra diaria ya está llena (jugar = por vicio). */
export function DailyEnergyNote({ className }: { className?: string }) {
  const { progress } = useProgress()
  const reward = normalizeRewardCycles(progress.reward)
  if (reward.dailyPoints < rewardGoalConfig.dailyCap) return null
  return (
    <p className={className} role="status">
      {energyCopy.playForFun}
    </p>
  )
}
