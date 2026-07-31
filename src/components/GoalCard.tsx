import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArayHubIcon } from '@/components/ArayHubIcon'
import { energyCopy, rewardGoalConfig } from '@/config/rewardGoal'
import { useProgress } from '@/progress/ProgressContext'
import { markPendingCelebrated, normalizeRewardCycles } from '@/reward/engine'

export function GoalCard({ compact = false }: { compact?: boolean }) {
  const { progress, updateReward } = useProgress()
  const reward = normalizeRewardCycles(progress.reward)
  const target = rewardGoalConfig.targetPoints
  const current = reward.pointsTotal
  const cycleNumber = reward.currentCycleNumber
  const pendingFirst = reward.pendingCycleNumbers[0] ?? null
  const pct = Math.min(100, Math.round((current / target) * 100))
  const remaining = Math.max(0, target - current)
  const daily = reward.dailyPoints
  const dailyCap = rewardGoalConfig.dailyCap
  const [pulse, setPulse] = useState(false)
  const [showCelebrate, setShowCelebrate] = useState(false)

  useEffect(() => {
    setPulse(true)
    const t = window.setTimeout(() => setPulse(false), 500)
    return () => window.clearTimeout(t)
  }, [current, daily, pendingFirst])

  useEffect(() => {
    if (pendingFirst == null) return
    if (reward.celebratedPendingCycles.includes(pendingFirst)) return
    setShowCelebrate(true)
    updateReward(markPendingCelebrated(reward, pendingFirst))
    const t = window.setTimeout(() => setShowCelebrate(false), 2800)
    return () => window.clearTimeout(t)
    // Solo al aparecer un pendiente nuevo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFirst])

  const delivered = reward.deliveredCycleNumbers

  return (
    <section
      className={[
        'goal-card',
        compact ? 'goal-card--compact' : '',
        pulse ? 'goal-card--pulse' : '',
        pendingFirst != null ? 'goal-card--near' : '',
        showCelebrate ? 'goal-card--celebrate' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby="goal-title"
    >
      <div className="goal-card__row">
        <div className="goal-card__robot" aria-hidden="true">
          <ArayHubIcon id="drop_robot" className="goal-card__robot-img" />
        </div>
        <div className="goal-card__head">
          {pendingFirst != null ? (
            <>
              <p className="goal-card__eyebrow">¡Premio conseguido!</p>
              <h2 id="goal-title" className="goal-card__prize">
                ¡PREMIO {pendingFirst} CONSEGUIDO!
              </h2>
              <p className="goal-card__sub">Avísale a Neni para recogerlo</p>
            </>
          ) : delivered.length > 0 && current === 0 && cycleNumber > 1 ? (
            <>
              <p className="goal-card__eyebrow">PREMIO {cycleNumber - 1} ENTREGADO ✓</p>
              <h2 id="goal-title" className="goal-card__prize">
                ¡Vamos a por el PREMIO {cycleNumber}!
              </h2>
              <p className="goal-card__sub">
                {current} / {target} de energía
              </p>
            </>
          ) : (
            <>
              <p className="goal-card__eyebrow">PRÓXIMO DROP</p>
              <h2 id="goal-title" className="goal-card__prize">
                {rewardGoalConfig.rewardLabel}
              </h2>
              <p className="goal-card__sub">
                {energyCopy.total(current, target)}
                {remaining > 0
                  ? ` · Te faltan ${remaining} de energía para desbloquearlo`
                  : ''}
              </p>
            </>
          )}
        </div>
      </div>

      <div
        className="goal-card__meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={pendingFirst != null ? target : current}
        aria-label={`Premio ${cycleNumber}: ${current} de ${target} de energía`}
      >
        <span style={{ width: `${pendingFirst != null ? 100 : pct}%` }} />
      </div>
      <p className="goal-card__meter-label">
        {pendingFirst != null
          ? `${target} / ${target} de energía`
          : energyCopy.total(current, target)}
      </p>

      <p className="goal-card__status">
        {energyCopy.today(Math.min(daily, dailyCap), dailyCap)}
        {daily >= dailyCap ? ` · ${energyCopy.dailyComplete}` : ''}
      </p>
      {daily >= dailyCap ? (
        <p className="goal-card__play-fun" role="status">
          {energyCopy.playForFun}
        </p>
      ) : null}

      {delivered.length > 0 ? (
        <ul className="goal-card__vitrine" aria-label="Premios anteriores">
          {delivered.map((n) => (
            <li key={n}>PREMIO {n} ENTREGADO ✓</li>
          ))}
        </ul>
      ) : null}

      {pendingFirst == null ? (
        <Link to="/missions/mates/tables" className="btn btn-ghost btn-block goal-card__cta">
          Farmear energía
        </Link>
      ) : null}
    </section>
  )
}
