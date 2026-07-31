import { Link } from 'react-router-dom'
import { modeArtUrl, type ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { IconPlay } from '@/components/Icons'
import { SPELL_MODE_LABELS, type SpellPlayMode } from '@/spelling'
import './spelling.css'

const MODES: Array<{ mode: SpellPlayMode; art: ModeArtId; className: string; text: string }> = [
  { mode: 'complete', art: 'spell-complete', className: 'mode-poster--challenge', text: 'hay / ahí / ¡ay!' },
  { mode: 'correct', art: 'spell-correct', className: 'mode-poster--train', text: 'hecho o echo' },
  { mode: 'intruder', art: 'spell-intruder', className: 'mode-poster--misses', text: 'Encuentra la falta' },
  { mode: 'missing', art: 'spell-missing', className: 'mode-poster--learn', text: 'Letra de la regla' },
  { mode: 'picture', art: 'spell-picture', className: 'mode-poster--match', text: 'Imagen → escritura' },
  { mode: 'mix', art: 'spell-mix', className: 'mode-poster--random', text: 'Todas las reglas' },
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
      <p className="spell-modes__lead">Elige un modo y dispara</p>
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
