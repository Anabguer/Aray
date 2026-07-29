import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArayHubIcon } from '@/components/ArayHubIcon'
import { ConfirmDialog } from '@/components/quiz/QuizWidgets'
import { energyCopy, rewardGoalConfig } from '@/config/rewardGoal'
import { useProgress } from '@/progress/ProgressContext'
import { confirmAdultGoal, resetRewardGoal } from '@/reward/engine'

export function GoalCard({ compact = false }: { compact?: boolean }) {
  const { progress, updateReward } = useProgress()
  const reward = progress.reward
  const target = rewardGoalConfig.targetPoints
  const current = reward.pointsTotal
  const pct = Math.min(100, Math.round((current / target) * 100))
  const daily = reward.dailyPoints
  const dailyCap = rewardGoalConfig.dailyCap
  const completed = reward.goalStatus === 'completed' || reward.goalStatus === 'validated'
  const nearDrop = !completed && pct >= 70
  const [pulse, setPulse] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmValidate, setConfirmValidate] = useState(false)

  useEffect(() => {
    setPulse(true)
    const t = window.setTimeout(() => setPulse(false), 500)
    return () => window.clearTimeout(t)
  }, [current, daily])

  return (
    <section
      className={[
        'goal-card',
        compact ? 'goal-card--compact' : '',
        pulse ? 'goal-card--pulse' : '',
        nearDrop ? 'goal-card--near' : '',
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
          {compact ? (
            <>
              <p className="goal-card__eyebrow">Próximo drop</p>
              <h2 id="goal-title" className="goal-card__prize">
                {rewardGoalConfig.rewardLabel}
              </h2>
            </>
          ) : (
            <h2 id="goal-title" className="goal-card__title">
              {rewardGoalConfig.title}
            </h2>
          )}
          {!compact ? (
            <p className="goal-card__sub">
              {completed
                ? reward.goalStatus === 'validated'
                  ? 'Drop validado por el adulto'
                  : energyCopy.dropUnlocked
                : energyCopy.total(current, target)}
            </p>
          ) : completed ? (
            <p className="goal-card__sub">
              {reward.goalStatus === 'validated' ? 'Drop validado' : energyCopy.dropUnlocked}
            </p>
          ) : null}
        </div>
      </div>

      <div
        className="goal-card__meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={current}
        aria-label={`Energía del drop: ${current} de ${target}`}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="goal-card__meter-label">
        {current} / {target}
      </p>

      {!compact ? (
        <p className="goal-card__status">
          {energyCopy.today(Math.min(daily, dailyCap), dailyCap)}
          {daily >= dailyCap ? ` · ${energyCopy.dailyComplete}` : ''}
        </p>
      ) : null}
      {!compact ? <p className="goal-card__note">{rewardGoalConfig.childNote}</p> : null}

      {reward.goalStatus === 'completed' ? (
        <div className="goal-card__adult-actions">
          <button type="button" className="btn btn-secondary btn-block" onClick={() => setConfirmValidate(true)}>
            Confirmar validación adulta
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={() => setConfirmReset(true)}>
            Reiniciar meta
          </button>
        </div>
      ) : (
        <Link to="/missions/mates/tables" className="btn btn-ghost btn-block goal-card__cta">
          Cargar energía
        </Link>
      )}

      <ConfirmDialog
        open={confirmValidate}
        title="¿Confirmar validación?"
        body="Marca el drop como validado por el adulto. No compra ni entrega Robux automáticamente."
        confirmLabel="Sí, validar"
        onCancel={() => setConfirmValidate(false)}
        onConfirm={() => {
          updateReward(confirmAdultGoal(reward))
          setConfirmValidate(false)
        }}
      />
      <ConfirmDialog
        open={confirmReset}
        title="¿Reiniciar la meta?"
        body="La energía de este drop volverá a 0. XP, monedas y dominio no se borran."
        confirmLabel="Sí, reiniciar meta"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          updateReward(resetRewardGoal(reward))
          setConfirmReset(false)
        }}
      />
    </section>
  )
}
