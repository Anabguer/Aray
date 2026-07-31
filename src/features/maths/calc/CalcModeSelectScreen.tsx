import { Link } from 'react-router-dom'
import { modeArtUrl, type ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { IconPlay } from '@/components/Icons'
import { CALC_DURATION_SEC, CALC_MODE_LABELS, type CalcPlayMode } from '@/calc'
import './calc.css'

const MODES: Array<{
  mode: CalcPlayMode
  art: ModeArtId
  className: string
  text: string
}> = [
  { mode: 'mix', art: 'reto-rapido', className: 'mode-poster--challenge', text: `${CALC_DURATION_SEC}s · todo mezclado` },
  { mode: 'add', art: 'entrena', className: 'mode-poster--train', text: 'Suma y elige' },
  { mode: 'sub', art: 'mis-fallos', className: 'mode-poster--misses', text: 'Resta y elige' },
  { mode: 'missing', art: 'aprende', className: 'mode-poster--learn', text: '8 + ? = 15' },
  { mode: 'doubles', art: 'empareja', className: 'mode-poster--match', text: '9 + 9' },
  { mode: 'halves', art: 'sorpresa', className: 'mode-poster--random', text: 'Mitad de 18' },
  { mode: 'near10', art: 'entrena', className: 'mode-poster--train', text: 'Completa hasta 10' },
  { mode: 'compare', art: 'aprende', className: 'mode-poster--learn', text: '¿Cuál es mayor?' },
  { mode: 'order', art: 'empareja', className: 'mode-poster--match', text: 'Menor → mayor' },
  { mode: 'truefalse', art: 'reto-rapido', className: 'mode-poster--challenge', text: '¿Correcto o no?' },
]

function ModePoster({
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
        <img
          src={modeArtUrl(art)}
          alt=""
          className="mode-poster__img"
          width={512}
          height={512}
          draggable={false}
          decoding="async"
        />
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

export function CalcModeSelectScreen() {
  return (
    <AppShell title="CÁLCULO" shortTitle="Cálculo" showBack backTo="/missions/mates">
      <p className="calc-modes__lead">
        Piensa rápido · {CALC_DURATION_SEC} segundos · solo botones
      </p>
      <div className="mode-posters mode-posters--calc" role="list">
        {MODES.map((m) => (
          <ModePoster
            key={m.mode}
            art={m.art}
            title={CALC_MODE_LABELS[m.mode].toUpperCase()}
            text={m.text}
            className={m.className}
            to={`/missions/mates/calc/${m.mode}`}
          />
        ))}
      </div>
    </AppShell>
  )
}
