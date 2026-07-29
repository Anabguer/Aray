import { tableArtUrl } from '@/assets/tables'
import type { PlayableTable } from '@/config/playConfig'
import { tableStatus, type TableStatusKind } from '@/math/tableMastery'
import type { TableProgress } from '@/math/types'

type TableLevelCardProps = {
  table: PlayableTable
  progress: TableProgress
  selected: boolean
  selectionOrder?: number | null
  onToggle: () => void
}

function statusClass(kind: TableStatusKind): string {
  switch (kind) {
    case 'mastered':
      return 'is-mastered'
    case 'mastered_review':
      return 'is-review'
    case 'needs_train':
      return 'is-needs-train'
    case 'solid':
      return 'is-almost'
    case 'learning':
      return 'is-training'
    default:
      return 'is-new'
  }
}

function statusLabel(label: string, hasDomadaBadge: boolean): string | null {
  if (hasDomadaBadge) return null
  if (label === 'Sin practicar') return 'Nueva'
  return label
}

export function TableLevelCard({
  table,
  progress,
  selected,
  selectionOrder,
  onToggle,
}: TableLevelCardProps) {
  const status = tableStatus(progress)
  const art = tableArtUrl(table)
  const last = progress.lastRoundScore !== null ? `${progress.lastRoundScore}/10` : null
  const best = progress.bestRoundScore > 0 ? `${progress.bestRoundScore}/10` : null
  const isDomada = status.kind === 'mastered' || status.kind === 'mastered_review'
  const label = statusLabel(status.label, isDomada)
  const scoreLine =
    last && best ? `Último ${last} · Récord ${best}` : last ? `Último ${last}` : best ? `Récord ${best}` : null

  return (
    <button
      type="button"
      className={`level-card ${statusClass(status.kind)}${selected ? ' is-selected' : ''}`}
      onClick={onToggle}
      aria-pressed={selected}
      aria-label={`Tabla del ${table}. ${status.label}${last ? `. Último ${last}` : ''}`}
    >
      <div className="level-card__art">
        {art ? (
          <img src={art} alt="" className="level-card__img" width={512} height={512} draggable={false} />
        ) : (
          <span className="level-card__fallback">{table}</span>
        )}

        {selected && selectionOrder != null ? (
          <span className="level-card__order" aria-hidden="true">
            {selectionOrder}
          </span>
        ) : null}

        {isDomada ? (
          <span className="level-card__badge level-card__badge--domada" aria-hidden="true">
            DOMADA
          </span>
        ) : null}

        {status.kind === 'mastered_review' ? (
          <span className="level-card__badge level-card__badge--review" aria-hidden="true">
            Repasar
          </span>
        ) : null}

        <div className="level-card__overlay">
          <p className="level-card__title">Tabla del {table}</p>
          {label ? <p className="level-card__status">{label}</p> : null}
          {scoreLine ? <p className="level-card__scores">{scoreLine}</p> : null}
          <span className="level-card__bar" aria-hidden="true">
            <span style={{ width: `${Math.max(8, progress.masteryScore)}%` }} />
          </span>
          <span className="level-card__cta">{selected ? 'Elegida' : 'Elegir'}</span>
        </div>
      </div>
    </button>
  )
}
