import { Link } from 'react-router-dom'
import { dailySkillIcons } from '@/assets/daily'
import { missionEnergyConfig } from '@/config/rewardGoal'
import { useDailyMission } from '@/daily/DailyMissionContext'
import './dailyMission.css'

export function DailyMissionCard() {
  const { tasks, progress, completedCount, allDone } = useDailyMission()

  return (
    <section
      className={`daily-mission${allDone ? ' daily-mission--ready' : ''}`}
      aria-labelledby="daily-mission-title"
    >
      <div className="daily-mission__top">
        <h2 id="daily-mission-title" className="daily-mission__eyebrow">
          Misión diaria
        </h2>
        <p className="daily-mission__count" aria-live="polite">
          {completedCount}/{tasks.length}
          {allDone ? ' ✓' : ''}
        </p>
      </div>

      <ul className="daily-mission__bubbles">
        {tasks.map((t) => {
          const cur = progress[t.key] ?? 0
          const done = cur >= t.target
          const frac = `${Math.min(cur, t.target)}/${t.target}`
          const unit = missionEnergyConfig.perUnit[t.key]
          return (
            <li key={t.key}>
              <Link
                to={t.href}
                className={`daily-mission__bubble${done ? ' is-done' : ''}`}
                title={`${t.label}: ${frac} (+${unit} energía c/u)`}
                aria-label={`${t.label}: ${frac}${done ? ', completado' : ''}`}
              >
                <span className="daily-mission__orb-wrap">
                  <span className="daily-mission__orb">
                    <img src={dailySkillIcons[t.key]} alt="" width={56} height={56} draggable={false} />
                  </span>
                  {done ? (
                    <span className="daily-mission__tick" aria-hidden="true">
                      ✓
                    </span>
                  ) : null}
                </span>
                <span className="daily-mission__bubble-label">{t.label}</span>
                <span className="daily-mission__bubble-frac">{frac}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
