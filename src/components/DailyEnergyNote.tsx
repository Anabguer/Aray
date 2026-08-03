import { energyCopy, rewardGoalConfig } from '@/config/rewardGoal'
import { useProgress } from '@/progress/ProgressContext'
import { normalizeRewardCycles } from '@/reward/engine'
import './dailyEnergyNote.css'

type DailyEnergyNoteProps = {
  className?: string
  /** Versión más baja para caber en cards (drop / resumen). */
  compact?: boolean
}

/** Aviso visual cuando la barra diaria ya está llena (jugar = por vicio). */
export function DailyEnergyNote({ className = '', compact = false }: DailyEnergyNoteProps) {
  const { progress } = useProgress()
  const reward = normalizeRewardCycles(progress.reward)
  if (reward.dailyPoints < rewardGoalConfig.dailyCap) return null

  return (
    <aside
      className={[
        'daily-energy-note',
        compact ? 'daily-energy-note--compact' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
    >
      <div className="daily-energy-note__glow" aria-hidden="true" />
      <div className="daily-energy-note__row">
        <span className="daily-energy-note__badge" aria-hidden="true">
          ⚡
        </span>
        <div className="daily-energy-note__copy">
          <p className="daily-energy-note__title">{energyCopy.playForFunTitle}</p>
          <p className="daily-energy-note__body">{energyCopy.playForFun}</p>
        </div>
      </div>
      <div
        className="daily-energy-note__meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={100}
        aria-label={energyCopy.today(rewardGoalConfig.dailyCap, rewardGoalConfig.dailyCap)}
      >
        <span />
      </div>
    </aside>
  )
}
