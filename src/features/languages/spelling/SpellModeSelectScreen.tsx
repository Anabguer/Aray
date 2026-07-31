import { Link } from 'react-router-dom'
import { modeArtUrl, type ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { IconPlay } from '@/components/Icons'
import { SPELL_MODE_LABELS, type SpellPlayMode } from '@/spelling'
import './spelling.css'

const MODES: Array<{ mode: SpellPlayMode; art: ModeArtId; className: string; text: string }> = [
  { mode: 'missing', art: 'aprende', className: 'mode-poster--learn', text: 'Letra de la regla' },
  { mode: 'correct', art: 'entrena', className: 'mode-poster--train', text: 'cantaba o cantava' },
  { mode: 'picture', art: 'empareja', className: 'mode-poster--match', text: 'Imagen → ortografía' },
  { mode: 'intruder', art: 'mis-fallos', className: 'mode-poster--misses', text: '¿Cuál está mal?' },
  { mode: 'complete', art: 'reto-rapido', className: 'mode-poster--challenge', text: 'Con pista de regla' },
  { mode: 'mix', art: 'sorpresa', className: 'mode-poster--random', text: '12 de repaso mezclado' },
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

export function SpellModeSelectScreen() {
  return (
    <AppShell title="ORTOGRAFÍA" shortTitle="Ortografía" showBack backTo="/missions/languages">
      <p className="spell-modes__lead">
        Repaso de 3.º: b/v, g/j, h, ll/y, r/rr, mb/mp… · solo botones
      </p>
      <div className="mode-posters mode-posters--spell" role="list">
        {MODES.map((m) => (
          <Poster
            key={m.mode}
            art={m.art}
            title={SPELL_MODE_LABELS[m.mode].toUpperCase()}
            text={m.text}
            className={m.className}
            to={`/missions/languages/spelling/${m.mode}`}
          />
        ))}
      </div>
    </AppShell>
  )
}
