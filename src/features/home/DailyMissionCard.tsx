import { Link, useNavigate } from 'react-router-dom'
import { dailySkillIcons } from '@/assets/daily'
import { missionEnergyConfig } from '@/config/rewardGoal'
import { useDailyMission } from '@/daily/DailyMissionContext'
import { launchDailyMissionTables } from '@/math/launchDailyMissionTables'
import { usePlaySession } from '@/progress/PlayContext'
import { useProgress } from '@/progress/ProgressContext'
import './dailyMission.css'

export function DailyMissionCard() {
  const navigate = useNavigate()
  const { progress } = useProgress()
  const { setSelection, setActiveMode, setPendingQueue, setLastResult, setFromRandom } =
    usePlaySession()
  const { tasks, progress: missionProgress, completedCount, allDone } = useDailyMission()

  const startTables = () => {
    launchDailyMissionTables(navigate, progress, {
      setSelection,
      setActiveMode,
      setPendingQueue,
      setLastResult,
      setFromRandom,
    })
  }

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
          const cur = missionProgress[t.key] ?? 0
          const done = cur >= t.target
          const frac = `${Math.min(cur, t.target)}/${t.target}`
          const unit = missionEnergyConfig.perUnit[t.key]
          const className = `daily-mission__bubble${done ? ' is-done' : ''}`
          const title = `${t.label}: ${frac} (+${unit} energía c/u)`
          const ariaLabel = `${t.label}: ${frac}${done ? ', completado' : ''}`

          const content = (
            <>
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
            </>
          )

          return (
            <li key={t.key}>
              {t.key === 'tables' ? (
                <button
                  type="button"
                  className={className}
                  title={title}
                  aria-label={ariaLabel}
                  onClick={startTables}
                >
                  {content}
                </button>
              ) : (
                <Link to={t.href} className={className} title={title} aria-label={ariaLabel}>
                  {content}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
