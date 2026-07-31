import { Link } from 'react-router-dom'
import { dailySkillIcons } from '@/assets/daily'
import { useDailyMission } from '@/daily/DailyMissionContext'
import { sideActivityEnergy } from '@/config/rewardGoal'
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
    <section
      className={`daily-mission${allDone && !bonusClaimed ? ' daily-mission--ready' : ''}`}
      aria-labelledby="daily-mission-title"
    >
      <div className="daily-mission__top">
        <div className="daily-mission__head">
          <p className="daily-mission__eyebrow">Misión diaria</p>
          <h2 id="daily-mission-title" className="daily-mission__title">
            Misión del día
          </h2>
        </div>
        <p className="daily-mission__count" aria-live="polite">
          {completedCount}/{tasks.length}
          {allDone ? (bonusClaimed ? ' ✓' : ' ¡') : ''}
        </p>
      </div>

      <p className="daily-mission__lead">Completa las 5 y gana bonus de energía</p>

      <ul className="daily-mission__bubbles">
        {tasks.map((t) => {
          const cur = progress[t.key] ?? 0
          const done = cur >= t.target
          const frac = `${Math.min(cur, t.target)}/${t.target}`
          return (
            <li key={t.key}>
              <Link
                to={t.href}
                className={`daily-mission__bubble${done ? ' is-done' : ''}`}
                title={`${t.label}: ${frac}`}
                aria-label={`${t.label}: ${frac}${done ? ', completado' : ''}`}
              >
                <span className="daily-mission__orb">
                  <img src={dailySkillIcons[t.key]} alt="" width={56} height={56} draggable={false} />
                  {done ? <span className="daily-mission__tick" aria-hidden="true">✓</span> : null}
                </span>
                <span className="daily-mission__bubble-label">{t.label}</span>
                <span className="daily-mission__bubble-frac">{frac}</span>
              </Link>
            </li>
          )
        })}
      </ul>

      {allDone && !bonusClaimed ? (
        <button
          type="button"
          className="btn btn-primary btn-block daily-mission__claim"
          onClick={() => claimBonusIfReady()}
        >
          Recoger bonus (+{sideActivityEnergy.dailyBonus} energía)
        </button>
      ) : null}
    </section>
  )
}
