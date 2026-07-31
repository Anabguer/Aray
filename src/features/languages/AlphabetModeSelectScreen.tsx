import { Link } from 'react-router-dom'
import {
  alphabetModeStatus,
  normalizeAlphabetModeProgress,
  type AlphabetPlayMode,
} from '@/alphabet'
import { modeArtUrl, type ModeArtId } from '@/assets/modes'
import { AppShell } from '@/components/AppShell'
import { IconPlay } from '@/components/Icons'
import { useProgress } from '@/progress/ProgressContext'

function ModePoster({
  art,
  title,
  text,
  className,
  to,
  badge,
}: {
  art: ModeArtId
  title: string
  text: string
  className: string
  to: string
  badge?: string | null
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
        {badge ? <span className="alphabet-modes__badge">{badge}</span> : null}
        <span className="mode-poster__go" aria-hidden="true">
          <IconPlay className="mode-poster__go-icon" />
        </span>
      </span>
    </Link>
  )
}

const MODES: Array<{
  id: AlphabetPlayMode
  art: ModeArtId
  title: string
  text: string
  className: string
}> = [
  {
    id: 'missing',
    art: 'abc-falta',
    title: 'LETRA QUE FALTA',
    text: 'Completa la cadena',
    className: 'mode-poster--learn',
  },
  {
    id: 'neighbor',
    art: 'abc-vecina',
    title: 'SIGUIENTE / ANTERIOR',
    text: 'Lumo saca una letra',
    className: 'mode-poster--train',
  },
  {
    id: 'order-letters',
    art: 'abc-letras',
    title: 'ORDENA LETRAS',
    text: 'De la A a la Z',
    className: 'mode-poster--match',
  },
  {
    id: 'order-words',
    art: 'abc-palabras',
    title: 'ORDENA PALABRAS',
    text: 'A→Z o Z→A',
    className: 'mode-poster--challenge',
  },
  {
    id: 'random',
    art: 'abc-random',
    title: 'RANDOM',
    text: 'Cada ronda un juego distinto',
    className: 'mode-poster--random',
  },
]

export function AlphabetModeSelectScreen() {
  const { progress } = useProgress()
  const reviewHint = MODES.some((m) => {
    const st = alphabetModeStatus(
      normalizeAlphabetModeProgress(progress.alphabet.modes[m.id]),
    )
    return st.recommendPractice
  })

  return (
    <AppShell
      title="ABC"
      shortTitle="Abc"
      showBack
      backTo="/missions/languages"
    >
      <section className="alphabet-modes mode-select--lobby" aria-label="Modos del ABC">
        <p className="alphabet-modes__lead">
          Repasa las letras sin prisa. Elige un juego o deja que Lumo mezcle.
        </p>
        {reviewHint ? (
          <p className="alphabet-modes__review" role="status">
            Hay modos que conviene repasar (marcados abajo).
          </p>
        ) : null}
        <div className="mode-posters mode-posters--alphabet" role="list">
          {MODES.map((m) => {
            const st = alphabetModeStatus(
              normalizeAlphabetModeProgress(progress.alphabet.modes[m.id]),
            )
            const badge =
              st.kind === 'needs_train' || st.kind === 'mastered_review'
                ? 'Repasar'
                : st.kind === 'mastered'
                  ? 'Domado'
                  : null
            return (
              <ModePoster
                key={m.id}
                art={m.art}
                title={m.title}
                text={m.text}
                className={m.className}
                to={`/missions/languages/alphabet/${m.id}`}
                badge={badge}
              />
            )
          })}
        </div>
      </section>
    </AppShell>
  )
}
