import { Link } from 'react-router-dom'
import { modeArtUrl, type ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { IconPlay } from '@/components/Icons'
import { MONEY_MODE_LABELS, type MoneyPlayMode } from '@/money'
import './money.css'

const MODES: Array<{ mode: MoneyPlayMode; art: ModeArtId; className: string; text: string }> = [
  { mode: 'mix', art: 'sorpresa', className: 'mode-poster--random', text: 'Mezcla de dinero' },
  { mode: 'change', art: 'reto-rapido', className: 'mode-poster--challenge', text: 'Pagas y te devuelven' },
  { mode: 'build', art: 'entrena', className: 'mode-poster--train', text: 'Toca monedas' },
  { mode: 'spare', art: 'mis-fallos', className: 'mode-poster--misses', text: '¿Qué moneda sobra?' },
  { mode: 'sum', art: 'aprende', className: 'mode-poster--learn', text: 'Suma billetes y monedas' },
]

function Poster({
  art,
  title,
  text,
  className,
  to,
}: {
  art: ModeArtId
  title: string
  text: string
  className: string
  to: string
}) {
  return (
    <Link to={to} className={`mode-poster ${className}`} aria-label={`${title}. ${text}`}>
      <span className="mode-poster__media" aria-hidden="true">
        <img src={modeArtUrl(art)} alt="" className="mode-poster__img" width={512} height={512} draggable={false} />
        <span className="mode-poster__fade" />
      </span>
      <span className="mode-poster__body">
        <span className="mode-poster__title">{title}</span>
        <span className="mode-poster__text">{text}</span>
        <span className="mode-poster__go" aria-hidden="true">
          <IconPlay className="mode-poster__go-icon" />
        </span>
      </span>
    </Link>
  )
}

export function MoneyModeSelectScreen() {
  return (
    <AppShell title="DINERO" shortTitle="Dinero" showBack backTo="/missions/mates">
      <p className="money-modes__lead">Compras, cambio y monedas · solo botones</p>
      <div className="mode-posters mode-posters--money" role="list">
        {MODES.map((m) => (
          <Poster
            key={m.mode}
            art={m.art}
            title={MONEY_MODE_LABELS[m.mode].toUpperCase()}
            text={m.text}
            className={m.className}
            to={`/missions/mates/money/${m.mode}`}
          />
        ))}
      </div>
    </AppShell>
  )
}
