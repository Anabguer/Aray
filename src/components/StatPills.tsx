import { IconCoin, IconSpark } from '@/components/Icons'

export function StatPills({ xp, xpGoal, coins }: { xp: number; xpGoal: number; coins: number }) {
  return (
    <div className="stat-pills" aria-label="Indicadores de demostración">
      <div className="stat-pill" title="XP de demostración">
        <IconSpark className="stat-pill__icon" />
        <div className="stat-pill__body">
          <span className="stat-pill__label">XP</span>
          <span className="stat-pill__value">
            {xp}
            <span className="stat-pill__muted">/{xpGoal}</span>
          </span>
          <span className="stat-pill__bar" aria-hidden="true">
            <span style={{ width: `${Math.min(100, Math.round((xp / xpGoal) * 100))}%` }} />
          </span>
        </div>
      </div>
      <div className="stat-pill" title="Monedas de demostración">
        <IconCoin className="stat-pill__icon" />
        <div className="stat-pill__body">
          <span className="stat-pill__label">Monedas</span>
          <span className="stat-pill__value">{coins}</span>
        </div>
      </div>
    </div>
  )
}
