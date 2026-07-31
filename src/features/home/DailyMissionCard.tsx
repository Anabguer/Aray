import { Link } from 'react-router-dom'
import { useDailyMission } from '@/daily/DailyMissionContext'
import { activityWeightDefaults } from '@/config/rewardGoal'
import './dailyMission.css'

export function DailyMissionCard() {
  const {
    tasks,
    progress,
    completedCount,
    allDone,
    bonusClaimed,
    claimBonusIfReady,
  } = useDailyMission()

  return (
    <section className="daily-mission" aria-labelledby="daily-mission-title">
      <div className="daily-mission__head">
        <h2 id="daily-mission-title" className="daily-mission__title">
          Misión del día
        </h2>
        <p className="daily-mission__lead">Completa todo y gana bonus de energía</p>
      </div>

      <div className="daily-mission__bar" aria-hidden="true">
        {tasks.map((t) => {
          const done = (progress[t.key] ?? 0) >= t.target
          return <span key={t.key} className={`daily-mission__seg${done ? ' is-on' : ''}`} />
        })}
      </div>
      <p className="daily-mission__count">
        {completedCount}/{tasks.length}
        {allDone ? (bonusClaimed ? ' · ¡Bonus cobrado!' : ' · ¡Lista!') : ''}
      </p>

      <ul className="daily-mission__list">
        {tasks.map((t) => {
          const cur = progress[t.key] ?? 0
          const done = cur >= t.target
          return (
            <li key={t.key} className={`daily-mission__item${done ? ' is-done' : ''}`}>
              <span className="daily-mission__check" aria-hidden="true">
                {done ? '✓' : '○'}
              </span>
              <Link to={t.href} className="daily-mission__link">
                {t.label}
                <span className="daily-mission__frac">
                  {Math.min(cur, t.target)}/{t.target}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      {allDone && !bonusClaimed ? (
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => claimBonusIfReady()}
        >
          Recoger bonus (+{activityWeightDefaults.special} energía)
        </button>
      ) : null}
    </section>
  )
}
