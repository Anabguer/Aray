import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import {
  achievementCatalog,
  achievementIsUnlocked,
  achievementRewardLabel,
  type AchievementCategory,
  type AchievementDefinition,
} from '@/achievements/catalog'
import { useProgress } from '@/progress/ProgressContext'

type CollectionFilter = 'todo' | AchievementCategory

export function CollectionScreen() {
  const { progress, claimAchievement } = useProgress()
  const [filter, setFilter] = useState<CollectionFilter>('todo')
  const [selected, setSelected] = useState<AchievementDefinition | null>(null)

  const unlockedCount = achievementCatalog.filter((item) =>
    achievementIsUnlocked(item, progress),
  ).length
  const pendingRewards = achievementCatalog.filter(
    (item) =>
      achievementIsUnlocked(item, progress) &&
      !progress.achievements.claimedIds.includes(item.id),
  ).length
  const visible = useMemo(
    () =>
      filter === 'todo'
        ? achievementCatalog
        : achievementCatalog.filter((item) => item.category === filter),
    [filter],
  )

  return (
    <AppShell title="Mi colección" showBack backTo="/">
      <section className="collection" aria-labelledby="collection-title">
        <header className="collection-hero">
          <div>
            <p className="collection-hero__eyebrow">SALA DE TROFEOS</p>
            <h2 id="collection-title">Mi colección</h2>
            <p>Completa retos, doma tablas y llena tu vitrina de piezas legendarias.</p>
          </div>
          <div className="collection-hero__score" aria-label={`${unlockedCount} logros conseguidos`}>
            <strong>
              {unlockedCount}/{achievementCatalog.length}
            </strong>
            <span>conseguidos</span>
          </div>
        </header>

        {pendingRewards > 0 ? (
          <p className="collection-alert" role="status">
            🎁 Tienes {pendingRewards} {pendingRewards === 1 ? 'premio listo' : 'premios listos'} para
            recoger
          </p>
        ) : null}

        <div className="collection-filters" role="group" aria-label="Filtrar colección">
          {[
            ['todo', 'Todo'],
            ['insignias', 'Insignias'],
            ['tablas', 'Tablas domadas'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={filter === id ? 'is-active' : ''}
              aria-pressed={filter === id}
              onClick={() => setFilter(id as CollectionFilter)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="collection-grid">
          {visible.map((achievement) => {
            const unlocked = achievementIsUnlocked(achievement, progress)
            const claimed = progress.achievements.claimedIds.includes(achievement.id)
            const current = Math.min(achievement.current(progress), achievement.target)
            return (
              <button
                key={achievement.id}
                type="button"
                className={`achievement-card ${unlocked ? 'is-unlocked' : 'is-locked'}`}
                onClick={() => setSelected(achievement)}
                aria-label={`${achievement.title}. ${unlocked ? 'Conseguido' : 'Bloqueado'}`}
              >
                <span className="achievement-card__art">
                  <img src={achievement.image} alt="" />
                  {!unlocked ? <span className="achievement-card__lock">🔒</span> : null}
                  {unlocked && !claimed ? <span className="achievement-card__gift">!</span> : null}
                </span>
                <strong>{achievement.title}</strong>
                <span className="achievement-card__progress">
                  <span style={{ width: `${Math.min(100, (current / achievement.target) * 100)}%` }} />
                </span>
                <small>
                  {unlocked ? (claimed ? 'En tu vitrina' : 'Premio listo') : `${current}/${achievement.target}`}
                </small>
              </button>
            )
          })}
        </div>
      </section>

      {selected ? (
        <AchievementDialog
          achievement={selected}
          progress={progress}
          onClose={() => setSelected(null)}
          onClaim={() => claimAchievement(selected.id)}
        />
      ) : null}
    </AppShell>
  )
}

function AchievementDialog({
  achievement,
  progress,
  onClose,
  onClaim,
}: {
  achievement: AchievementDefinition
  progress: ReturnType<typeof useProgress>['progress']
  onClose: () => void
  onClaim: () => boolean
}) {
  const unlocked = achievementIsUnlocked(achievement, progress)
  const claimed = progress.achievements.claimedIds.includes(achievement.id)
  const current = Math.min(achievement.current(progress), achievement.target)
  const [justClaimed, setJustClaimed] = useState(false)

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="achievement-dialog__backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="achievement-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievement-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="achievement-dialog__close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <div className={`achievement-dialog__art ${unlocked ? '' : 'is-locked'}`}>
          <img src={achievement.image} alt="" />
        </div>
        <p className="achievement-dialog__state">
          {unlocked ? 'LOGRO DESBLOQUEADO' : 'PISTA DE DESBLOQUEO'}
        </p>
        <h2 id="achievement-dialog-title">{unlocked ? achievement.title : 'Logro secreto'}</h2>
        <p className="achievement-dialog__description">
          {unlocked ? achievement.shortDescription : achievement.howToUnlock}
        </p>

        <div className="achievement-dialog__progress">
          <div>
            <span>Progreso</span>
            <strong>
              {current}/{achievement.target}
            </strong>
          </div>
          <span>
            <span style={{ width: `${Math.min(100, (current / achievement.target) * 100)}%` }} />
          </span>
        </div>

        <div className="achievement-dialog__reward">
          <span>PREMIO</span>
          <strong>🎁 {achievementRewardLabel(achievement.reward)}</strong>
        </div>

        {unlocked && !claimed && !justClaimed ? (
          <button
            type="button"
            className="btn btn-primary achievement-dialog__claim"
            onClick={() => {
              if (onClaim()) setJustClaimed(true)
            }}
          >
            RECOGER PREMIO
          </button>
        ) : unlocked ? (
          <p className="achievement-dialog__claimed">✓ Premio recogido</p>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            SEGUIR JUGANDO
          </button>
        )}
      </section>
    </div>
  )
}
