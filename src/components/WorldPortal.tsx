import { Link } from 'react-router-dom'
import { SubjectIcon } from '@/components/ZoneIcons'
import { Lumo } from '@/lumo/Lumo'
import type { SubjectId } from '@/data/types'

export type WorldPortalTheme = 'maths' | 'languages' | 'english'

type WorldPortalProps = {
  theme: WorldPortalTheme
  title: string
  path: string
  playable: boolean
  featured?: boolean
}

const themeToHubId: Record<WorldPortalTheme, SubjectId> = {
  maths: 'mates',
  languages: 'catala',
  english: 'angles',
}

function MathsArt() {
  return (
    <div className="world-art" aria-hidden="true">
      <span className="world-art__path" />
      <span className="world-art__gate">
        <span className="world-art__ring" />
        <span className="world-art__ring world-art__ring--inner" />
        <span className="world-art__core" />
      </span>
      <span className="world-art__pad" />
      <span className="world-art__chip world-art__chip--a">7</span>
      <span className="world-art__chip world-art__chip--b">×</span>
      <span className="world-art__chip world-art__chip--c">4</span>
      <span className="world-art__chip world-art__chip--d">28</span>
      <span className="world-art__cube world-art__cube--a" />
      <span className="world-art__cube world-art__cube--b" />
      <span className="world-art__cube world-art__cube--c" />
    </div>
  )
}

function LanguagesArt() {
  return (
    <div className="world-art" aria-hidden="true">
      <span className="world-art__shelf world-art__shelf--warm" />
      <span className="world-art__book">
        <span className="world-art__page world-art__page--l" />
        <span className="world-art__page world-art__page--r" />
      </span>
      <span className="world-art__pencil" />
      <span className="world-art__tile world-art__tile--a">A</span>
      <span className="world-art__tile world-art__tile--b">B</span>
      <span className="world-art__tile world-art__tile--c">Z</span>
      <span className="world-art__sheet world-art__sheet--a" />
      <span className="world-art__sheet world-art__sheet--b" />
      <span className="world-art__gate world-art__gate--closed world-art__gate--warm">
        <span className="world-art__lock" />
      </span>
    </div>
  )
}

function EnglishArt() {
  return (
    <div className="world-art" aria-hidden="true">
      <span className="world-art__shelf world-art__shelf--teal" />
      <span className="world-art__bubble world-art__bubble--a">Hi!</span>
      <span className="world-art__bubble world-art__bubble--b">Play</span>
      <span className="world-art__bubble world-art__bubble--c">Yes</span>
      <span className="world-art__tile world-art__tile--d">E</span>
      <span className="world-art__tile world-art__tile--e">N</span>
      <span className="world-art__tile world-art__tile--f">G</span>
      <span className="world-art__gate world-art__gate--closed world-art__gate--teal">
        <span className="world-art__lock" />
      </span>
    </div>
  )
}

function WorldArt({ theme }: { theme: WorldPortalTheme }) {
  if (theme === 'maths') return <MathsArt />
  if (theme === 'languages') return <LanguagesArt />
  return <EnglishArt />
}

/** Un solo contenedor visual por mundo (escenario + info integrados). */
export function WorldPortal({ theme, title, path, playable, featured = false }: WorldPortalProps) {
  const classes = [
    'world-portal',
    `world-portal--${theme}`,
    playable ? 'world-portal--open' : 'world-portal--locked',
    featured ? 'world-portal--featured' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const label = playable ? `${title}. Entrar al mundo` : `${title}. Próximamente`

  return (
    <Link to={path} className={classes} aria-label={label}>
      <WorldArt theme={theme} />

      <div className="world-portal__info">
        <div className="world-portal__identity">
          <span className="world-portal__icon">
            <SubjectIcon id={themeToHubId[theme]} />
          </span>
          <div className="world-portal__copy">
            <span className="world-portal__title">{title}</span>
            {playable ? (
              <span className="world-portal__cue">¡Empieza por aquí!</span>
            ) : (
              <span className="world-portal__seal">Próximamente</span>
            )}
          </div>
        </div>

        {playable ? (
          <div className="world-portal__action">
            <div className="world-portal__guide">
              <Lumo state="idle" size="sm" label="Lumo te señala Matemáticas" />
              <p className="world-portal__guide-text" role="status">
                ¡Vamos a Mates!
              </p>
            </div>
            <span className="world-portal__cta">Entrar</span>
          </div>
        ) : null}
      </div>
    </Link>
  )
}
