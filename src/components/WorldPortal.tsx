import { Link } from 'react-router-dom'
import { SubjectIcon } from '@/components/ZoneIcons'
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

function PortalDecor({ theme }: { theme: WorldPortalTheme }) {
  if (theme === 'maths') {
    return (
      <svg className="world-portal__decor" viewBox="0 0 200 160" aria-hidden="true">
        <text className="world-portal__glyph world-portal__glyph--a" x="18" y="42">
          7
        </text>
        <text className="world-portal__glyph world-portal__glyph--b" x="148" y="38">
          ×
        </text>
        <text className="world-portal__glyph world-portal__glyph--c" x="160" y="118">
          3
        </text>
        <rect className="world-portal__block world-portal__block--a" x="28" y="108" width="22" height="22" rx="5" />
        <rect className="world-portal__block world-portal__block--b" x="118" y="78" width="18" height="18" rx="4" />
        <rect className="world-portal__block world-portal__block--c" x="86" y="24" width="14" height="14" rx="3" />
      </svg>
    )
  }
  if (theme === 'languages') {
    return (
      <svg className="world-portal__decor" viewBox="0 0 200 160" aria-hidden="true">
        <text className="world-portal__glyph world-portal__glyph--a" x="20" y="44">
          A
        </text>
        <text className="world-portal__glyph world-portal__glyph--b" x="152" y="48">
          B
        </text>
        <path
          className="world-portal__book"
          d="M42 108h48l8-6v38l-8 6H42zM98 102h48v44H98z"
        />
        <path className="world-portal__pencil" d="M150 118l22-22 8 8-22 22-10 2z" />
      </svg>
    )
  }
  return (
    <svg className="world-portal__decor" viewBox="0 0 200 160" aria-hidden="true">
      <text className="world-portal__glyph world-portal__glyph--a" x="22" y="46">
        Hi
      </text>
      <text className="world-portal__glyph world-portal__glyph--b" x="148" y="40">
        Abc
      </text>
      <ellipse className="world-portal__bubble world-portal__bubble--a" cx="56" cy="118" rx="28" ry="18" />
      <ellipse className="world-portal__bubble world-portal__bubble--b" cx="148" cy="96" rx="22" ry="14" />
      <circle className="world-portal__bubble world-portal__bubble--c" cx="92" cy="36" r="10" />
    </svg>
  )
}

/** Portal visual de un mundo (solo presentación; rutas las decide el padre). */
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
      <span className="world-portal__island" aria-hidden="true" />
      <span className="world-portal__glow" aria-hidden="true" />
      <PortalDecor theme={theme} />
      <span className="world-portal__icon">
        <SubjectIcon id={themeToHubId[theme]} />
      </span>
      <span className="world-portal__title">{title}</span>
      {featured && playable ? <span className="world-portal__cue">¡Empieza por aquí!</span> : null}
      {playable ? (
        <span className="world-portal__cta">Entrar</span>
      ) : (
        <span className="world-portal__seal">Próximamente</span>
      )}
    </Link>
  )
}
