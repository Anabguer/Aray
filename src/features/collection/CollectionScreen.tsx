import { useEffect, useId, useMemo, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { IconCoin, IconSpark } from '@/components/Icons'
import {
  achievementCatalog,
  achievementIsUnlocked,
  type AchievementCategory,
  type AchievementDefinition,
  type AchievementReward,
} from '@/achievements/catalog'
import { useProgress } from '@/progress/ProgressContext'
import { soundEngine } from '@/sound/soundEngine'

type CollectionFilter = 'todo' | AchievementCategory

function lumoLine(achievement: AchievementDefinition, unlocked: boolean): string {
  if (unlocked) {
    if (achievement.category === 'tablas') {
      return '¡Capturada! Esta pieza ya no se esconde.'
    }
    return 'A Lumo le gusta. Buen botín.'
  }

  if (achievement.category === 'tablas') {
    const table = achievement.id.match(/tabla-(\d+)/)?.[1]
    if (table === '2') return 'Domina la tabla del 2 y este número deja de hacerse el interesante.'
    if (table === '3') return 'La tabla del 3 quiere guerra. Qué atrevida.'
    if (table) return `Domina la tabla del ${table} y se viene contigo.`
    return 'Completa el reto y captura esta pieza.'
  }

  if (achievement.category === 'lenguas') {
    if (achievement.id === 'abc-primera') return 'Juega una ronda del ABC y la sacamos.'
    if (achievement.id === 'abc-crack') return 'Una ronda perfecta y es tuya.'
    if (achievement.id === 'abc-todos-domados') return 'Doma los cuatro modos y Lumo aplaude.'
    return 'Domina ese modo del ABC y la pieza entra.'
  }

  switch (achievement.id) {
    case 'primera-mision':
      return 'Esta pieza todavía se está escondiendo.'
    case 'racha-5':
      return 'Le falta un empujoncito para salir de la sombra.'
    case 'racha-10':
      return 'Un poco más y la sacamos de su escondite.'
    case 'reto-5':
      return 'Completa el reto y hacemos como que fue facilísimo.'
    case 'reto-perfecto':
      return 'Esta insignia se cree muy exclusiva.'
    case 'todas-domadas':
      return 'Casi la tienes. Lumo no ha tocado nada…'
    default:
      return 'Completa el objetivo y esta joyita entra en tu colección.'
  }
}

function RewardIcons({ reward }: { reward: AchievementReward }) {
  return (
    <span className="collection-reward">
      {reward.coins ? (
        <span className="collection-reward__item">
          <IconCoin className="collection-reward__icon" />
          <strong>+{reward.coins}</strong>
          <span>MONEDAS</span>
        </span>
      ) : null}
      {reward.xp ? (
        <span className="collection-reward__item">
          <IconSpark className="collection-reward__icon" />
          <strong>+{reward.xp}</strong>
          <span>XP</span>
        </span>
      ) : null}
    </span>
  )
}

function FilterIcon({ kind }: { kind: CollectionFilter }) {
  if (kind === 'insignias') {
    return (
      <svg className="collection-filter__icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="10" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M8.2 15.2 7 21l5-2.4L17 21l-1.2-5.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  if (kind === 'tablas') {
    return (
      <svg className="collection-filter__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7.5 7.5 16.5 16.5M16.5 7.5 7.5 16.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  if (kind === 'lenguas') {
    return (
      <svg className="collection-filter__icon" viewBox="0 0 24 24" aria-hidden="true">
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fill="currentColor"
          fontSize="11"
          fontWeight="800"
          fontFamily="system-ui,sans-serif"
        >
          ABC
        </text>
      </svg>
    )
  }
  return (
    <svg className="collection-filter__icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="7" height="7" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="5" width="7" height="7" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4" y="14" width="7" height="7" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="14" width="7" height="7" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

/** Núcleo apagado con aro incompleto — sin emojis. */
function PieceSeal({ className }: { className?: string }) {
  const ringId = useId().replace(/:/g, '')
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={ringId} x1="6" y1="8" x2="42" y2="40">
          <stop stopColor="#67e8f9" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="18" fill="rgba(4, 14, 28, 0.72)" />
      <circle
        cx="24"
        cy="24"
        r="15.5"
        fill="none"
        stroke={`url(#${ringId})`}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray="62 36"
        transform="rotate(-70 24 24)"
      />
      <circle cx="24" cy="24" r="7.2" fill="rgba(15, 28, 52, 0.95)" stroke="#64748b" strokeWidth="1.4" />
      <circle cx="24" cy="24" r="3.1" fill="#334155" />
      <circle cx="24" cy="22.6" r="1.15" fill="#67e8f9" opacity="0.55" />
    </svg>
  )
}

function PieceFrame({
  image,
  locked,
  kind,
  pulse,
}: {
  image: string
  locked: boolean
  kind: AchievementCategory
  pulse?: boolean
}) {
  return (
    <span
      className={[
        'piece-frame',
        `piece-frame--${kind}`,
        locked ? 'is-locked' : 'is-unlocked',
        pulse ? 'is-pulse' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="piece-frame__ring" aria-hidden="true" />
      <span className="piece-frame__pedestal" aria-hidden="true" />
      <span className="piece-frame__halo" aria-hidden="true" />
      <span className="piece-frame__mask">
        <span className="piece-frame__media">
          <img src={image} alt="" className="piece-frame__img" />
        </span>
      </span>
      {locked ? <PieceSeal className="piece-frame__seal" /> : null}
    </span>
  )
}

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
  const pct = Math.round((unlockedCount / achievementCatalog.length) * 100)

  const visible = useMemo(
    () =>
      filter === 'todo'
        ? achievementCatalog
        : achievementCatalog.filter((item) => item.category === filter),
    [filter],
  )

  const filters: Array<{ id: CollectionFilter; label: string }> = [
    { id: 'todo', label: 'TODAS' },
    { id: 'insignias', label: 'INSIGNIAS' },
    { id: 'tablas', label: 'TABLAS' },
    { id: 'lenguas', label: 'ABC' },
  ]

  return (
    <AppShell title="Mi colección" shortTitle="Colección" showBack backTo="/">
      <section className="collection" aria-labelledby="collection-counter-label">
        <div className="collection-toolbar">
          <div
            className="collection-meter"
            aria-labelledby="collection-counter-label"
            title={`${unlockedCount} de ${achievementCatalog.length} piezas`}
          >
            <span id="collection-counter-label" className="collection-meter__count">
              {unlockedCount}/{achievementCatalog.length}
            </span>
            <span className="collection-meter__label">PIEZAS</span>
            <span
              className="collection-meter__bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={achievementCatalog.length}
              aria-valuenow={unlockedCount}
            >
              <span style={{ width: `${pct}%` }} />
            </span>
          </div>

          <div className="collection-filters" role="group" aria-label="Filtrar colección">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`collection-filter ${filter === item.id ? 'is-active' : ''}`}
                aria-pressed={filter === item.id}
                onClick={() => setFilter(item.id)}
              >
                <FilterIcon kind={item.id} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {pendingRewards > 0 ? (
          <p className="collection-alert" role="status">
            <span className="collection-alert__dot" aria-hidden="true" />
            {pendingRewards === 1
              ? 'Hay 1 premio listo para recoger'
              : `Hay ${pendingRewards} premios listos para recoger`}
          </p>
        ) : null}

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
                <PieceFrame
                  image={achievement.image}
                  locked={!unlocked}
                  kind={achievement.category}
                />
                {unlocked && !claimed ? (
                  <span className="achievement-card__ready" aria-hidden="true">
                    !
                  </span>
                ) : null}
                <strong className="achievement-card__title">{achievement.title}</strong>
                <span className="achievement-card__progress">
                  <span
                    style={{ width: `${Math.min(100, (current / achievement.target) * 100)}%` }}
                  />
                </span>
                <small className="achievement-card__meta">
                  {unlocked
                    ? claimed
                      ? 'En tu vitrina'
                      : 'Premio listo'
                    : `${current}/${achievement.target}`}
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
  const voice = lumoLine(achievement, unlocked || justClaimed)

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
        className={`achievement-dialog ${justClaimed ? 'is-claimed-flash' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievement-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="achievement-dialog__close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>

        <PieceFrame
          image={achievement.image}
          locked={!unlocked && !justClaimed}
          kind={achievement.category}
          pulse={justClaimed}
        />

        <h2 id="achievement-dialog-title" className="achievement-dialog__title">
          {unlocked || justClaimed ? achievement.title : 'Pieza misteriosa'}
        </h2>

        <p className="achievement-dialog__state">
          {unlocked || justClaimed ? 'EN LA VITRINA' : 'BLOQUEADA'}
        </p>

        <p className="achievement-dialog__description">{voice}</p>

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
          <span className="achievement-dialog__reward-label">RECOMPENSA</span>
          <RewardIcons reward={achievement.reward} />
        </div>

        {unlocked && !claimed && !justClaimed ? (
          <button
            type="button"
            className="btn btn-primary achievement-dialog__claim"
            onClick={() => {
              if (onClaim()) {
                setJustClaimed(true)
                soundEngine.play('points-earned')
              }
            }}
          >
            RECOGER PREMIO
          </button>
        ) : unlocked || justClaimed ? (
          <p className="achievement-dialog__claimed" role="status">
            {justClaimed ? '¡Listo! Pieza iluminada en tu vitrina.' : 'Premio recogido'}
          </p>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            SEGUIR JUGANDO
          </button>
        )}
      </section>
    </div>
  )
}
