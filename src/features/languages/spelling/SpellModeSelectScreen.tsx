import { Link } from 'react-router-dom'
import { modeArtUrl, type ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { IconPlay } from '@/components/Icons'
import { SPELL_MODE_LABELS, type SpellPlayMode } from '@/spelling'
import './spelling.css'

type SpellPoster = {
  mode: SpellPlayMode
  art: ModeArtId
  className: string
  text: string
  tag: string
}

/** Dos protagonistas arriba + cuatro retos abajo (grid 4 cols alineada). */
const HEROES: SpellPoster[] = [
  {
    mode: 'mix',
    art: 'spell-mix',
    className: 'mode-poster--random',
    text: 'Todas las reglas en una partida',
    tag: 'DESTACADO',
  },
  {
    mode: 'intruder',
    art: 'spell-intruder',
    className: 'mode-poster--misses',
    text: 'Caza la palabra mal escrita',
    tag: 'RÁPIDO',
  },
]

const ROSTER: SpellPoster[] = [
  {
    mode: 'complete',
    art: 'spell-complete',
    className: 'mode-poster--challenge',
    text: 'hay / ahí / ¡ay!',
    tag: '01',
  },
  {
    mode: 'correct',
    art: 'spell-correct',
    className: 'mode-poster--train',
    text: 'hecho o echo',
    tag: '02',
  },
  {
    mode: 'missing',
    art: 'spell-missing',
    className: 'mode-poster--learn',
    text: 'Letra de la regla',
    tag: '03',
  },
  {
    mode: 'picture',
    art: 'spell-picture',
    className: 'mode-poster--match',
    text: 'Imagen → escritura',
    tag: '04',
  },
]

function Poster({
  art,
  title,
  text,
  className,
  tag,
  to,
  featured = false,
}: {
  art: ModeArtId
  title: string
  text: string
  className: string
  tag: string
  to: string
  featured?: boolean
}) {
  return (
    <Link
      to={to}
      className={[
        'mode-poster',
        'spell-slot',
        featured ? 'spell-slot--hero' : 'spell-slot--chip',
        className,
      ].join(' ')}
      aria-label={`${title}. ${text}`}
    >
      <span className="spell-slot__tag" aria-hidden="true">
        {tag}
      </span>
      <span className="mode-poster__media spell-slot__media" aria-hidden="true">
        <img
          src={modeArtUrl(art)}
          alt=""
          className="mode-poster__img"
          width={512}
          height={512}
          draggable={false}
        />
        <span className="mode-poster__fade" />
      </span>
      <span className="mode-poster__body spell-slot__body">
        <span className="mode-poster__title">{title}</span>
        <span className="mode-poster__text">{text}</span>
        <span className="spell-slot__cta" aria-hidden="true">
          <IconPlay className="spell-slot__cta-icon" />
          <span>JUGAR</span>
        </span>
      </span>
    </Link>
  )
}

export function SpellModeSelectScreen() {
  return (
    <AppShell title="ORTOGRAFÍA" shortTitle="Ortografía" showBack backTo="/missions/languages">
      <section className="spell-arena" aria-label="Selección de modo">
        <header className="spell-arena__head">
          <p className="spell-arena__kicker">Selecciona misión</p>
          <h2 className="spell-arena__title">Elige tu misión</h2>
        </header>

        <div className="spell-arena__board">
          <div className="spell-arena__heroes" role="list">
            {HEROES.map((m) => (
              <Poster
                key={m.mode}
                art={m.art}
                title={SPELL_MODE_LABELS[m.mode].toUpperCase()}
                text={m.text}
                className={m.className}
                tag={m.tag}
                featured
                to={`/missions/languages/spelling/${m.mode}`}
              />
            ))}
          </div>

          <p className="spell-arena__divider" aria-hidden="true">
            <span>Retos</span>
          </p>

          <div className="spell-arena__roster" role="list">
            {ROSTER.map((m) => (
              <Poster
                key={m.mode}
                art={m.art}
                title={SPELL_MODE_LABELS[m.mode].toUpperCase()}
                text={m.text}
                className={m.className}
                tag={m.tag}
                to={`/missions/languages/spelling/${m.mode}`}
              />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  )
}
