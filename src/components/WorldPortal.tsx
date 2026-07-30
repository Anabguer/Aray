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

function MathsScene() {
  return (
    <div className="world-scene world-scene--maths" aria-hidden="true">
      <span className="world-scene__mist" />
      <span className="world-scene__path" />
      <span className="world-scene__platform" />
      <span className="world-scene__gate">
        <span className="world-scene__ring" />
        <span className="world-scene__ring world-scene__ring--inner" />
        <span className="world-scene__core" />
      </span>
      <span className="world-scene__block world-scene__block--a">7</span>
      <span className="world-scene__block world-scene__block--b">×</span>
      <span className="world-scene__block world-scene__block--c">4</span>
      <span className="world-scene__block world-scene__block--d">=</span>
      <span className="world-scene__crystal world-scene__crystal--a" />
      <span className="world-scene__crystal world-scene__crystal--b" />
      <span className="world-scene__crystal world-scene__crystal--c" />
    </div>
  )
}

function LanguagesScene() {
  return (
    <div className="world-scene world-scene--languages" aria-hidden="true">
      <span className="world-scene__mist" />
      <span className="world-scene__platform world-scene__platform--warm" />
      <span className="world-scene__book">
        <span className="world-scene__page world-scene__page--l" />
        <span className="world-scene__page world-scene__page--r" />
      </span>
      <span className="world-scene__pencil" />
      <span className="world-scene__letter world-scene__letter--a">A</span>
      <span className="world-scene__letter world-scene__letter--b">R</span>
      <span className="world-scene__letter world-scene__letter--c">Y</span>
      <span className="world-scene__scrap world-scene__scrap--a" />
      <span className="world-scene__scrap world-scene__scrap--b" />
    </div>
  )
}

function EnglishScene() {
  return (
    <div className="world-scene world-scene--english" aria-hidden="true">
      <span className="world-scene__mist" />
      <span className="world-scene__platform world-scene__platform--teal" />
      <span className="world-scene__speech world-scene__speech--a">Hi!</span>
      <span className="world-scene__speech world-scene__speech--b">Go</span>
      <span className="world-scene__speech world-scene__speech--c">OK</span>
      <span className="world-scene__letter world-scene__letter--d">E</span>
      <span className="world-scene__letter world-scene__letter--e">N</span>
      <span className="world-scene__orb world-scene__orb--a" />
      <span className="world-scene__orb world-scene__orb--b" />
    </div>
  )
}

function Scene({ theme }: { theme: WorldPortalTheme }) {
  if (theme === 'maths') return <MathsScene />
  if (theme === 'languages') return <LanguagesScene />
  return <EnglishScene />
}

/** Portal-escenario de un mundo (presentación; la ruta la decide el padre). */
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
      <div className="world-portal__land">
        <Scene theme={theme} />
        {featured && playable ? (
          <div className="world-portal__guide">
            <Lumo state="idle" size="sm" label="Lumo te señala Matemáticas" />
            <p className="world-portal__guide-text" role="status">
              ¡Vamos a Mates!
            </p>
          </div>
        ) : null}
      </div>

      <div className="world-portal__hud">
        <span className="world-portal__icon">
          <SubjectIcon id={themeToHubId[theme]} />
        </span>
        <div className="world-portal__copy">
          <span className="world-portal__title">{title}</span>
          {featured && playable ? <span className="world-portal__cue">¡Empieza por aquí!</span> : null}
        </div>
        {playable ? <span className="world-portal__cta">Entrar</span> : <span className="world-portal__seal">Próximamente</span>}
      </div>
    </Link>
  )
}
