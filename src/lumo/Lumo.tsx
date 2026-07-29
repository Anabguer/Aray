import { useId } from 'react'
import type { LumoIntensity, LumoState } from '@/lumo/types'
import './Lumo.css'

export function Lumo({
  state = 'idle',
  intensity = 0,
  size = 'md',
  label = 'Lumo, compañero de ARAY',
  className = '',
}: {
  state?: LumoState
  intensity?: LumoIntensity
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const bodyGrad = `lumoBody-${uid}`
  const bellyGrad = `lumoBelly-${uid}`
  const limbGrad = `lumoLimb-${uid}`

  const classes = [
    'lumo',
    `lumo--${size}`,
    `lumo--${state}`,
    intensity > 0 ? `lumo--i${intensity}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} role="img" aria-label={label}>
      <span className="lumo__aura" aria-hidden="true" />
      <span className="lumo__spark lumo__spark--a" aria-hidden="true" />
      <span className="lumo__spark lumo__spark--b" aria-hidden="true" />
      <span className="lumo__spark lumo__spark--c" aria-hidden="true" />
      <svg className="lumo__svg" viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <radialGradient id={bodyGrad} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="55%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </radialGradient>
          <radialGradient id={bellyGrad} cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="var(--lumo-belly-hi)" />
            <stop offset="100%" stopColor="var(--lumo-belly-lo)" />
          </radialGradient>
          <linearGradient id={limbGrad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>

        <ellipse className="lumo__shadow" cx="60" cy="112" rx="30" ry="5.5" />

        <g className="lumo__figure">
          {/* Brazos detrás del torso */}
          <ellipse
            className="lumo__arm lumo__arm--l"
            cx="24"
            cy="70"
            rx="7.5"
            ry="5"
            fill={`url(#${limbGrad})`}
          />
          <ellipse
            className="lumo__arm lumo__arm--r"
            cx="96"
            cy="70"
            rx="7.5"
            ry="5"
            fill={`url(#${limbGrad})`}
          />

          <path
            className="lumo__body"
            d="M60 22c19 0 34 15 34 36 0 26-13 42-34 42S26 84 26 58C26 37 41 22 60 22z"
            fill={`url(#${bodyGrad})`}
          />

          {/* Orejitas ancladas al coronilla (encima del cuerpo, sin CSS transform) */}
          <g className="lumo__ears">
            <path
              className="lumo__ear lumo__ear--l"
              d="M46 26c-2 0-8-1-12-8-3-6 1-14 8-12 5 1 9 7 8 13-1 4-3 7-4 7z"
              fill={`url(#${bodyGrad})`}
            />
            <path
              className="lumo__ear lumo__ear--r"
              d="M74 26c2 0 8-1 12-8 3-6-1-14-8-12-5 1-9 7-8 13 1 4 3 7 4 7z"
              fill={`url(#${bodyGrad})`}
            />
          </g>

          {/* Barriga baja — indicador de energía */}
          <ellipse
            className="lumo__belly-glow"
            cx="60"
            cy="84"
            rx="19"
            ry="14"
            fill="none"
          />
          <ellipse
            className="lumo__belly"
            cx="60"
            cy="84"
            rx="16"
            ry="12"
            fill={`url(#${bellyGrad})`}
          />

          {/* Patitas delante del borde inferior */}
          <ellipse
            className="lumo__leg lumo__leg--l"
            cx="48"
            cy="102"
            rx="8"
            ry="5"
            fill={`url(#${limbGrad})`}
          />
          <ellipse
            className="lumo__leg lumo__leg--r"
            cx="72"
            cy="102"
            rx="8"
            ry="5"
            fill={`url(#${limbGrad})`}
          />

          <g className="lumo__face">
            <ellipse className="lumo__eye lumo__eye--l" cx="46" cy="45" rx="5.5" ry="6.5" />
            <ellipse className="lumo__eye lumo__eye--r" cx="74" cy="45" rx="5.5" ry="6.5" />
            <g className="lumo__pupils">
              <circle className="lumo__pupil lumo__pupil--l" cx="47.5" cy="46" r="2.2" />
              <circle className="lumo__pupil lumo__pupil--r" cx="75.5" cy="46" r="2.2" />
            </g>
            <path className="lumo__mouth" d="M53 57c3.5 4.2 10.5 4.2 14 0" />
            <path className="lumo__mouth-oops" d="M57 56.5c0 3.2 6 3.2 6 0" />
            <circle className="lumo__blush lumo__blush--l" cx="36" cy="55" r="3.5" />
            <circle className="lumo__blush lumo__blush--r" cx="84" cy="55" r="3.5" />
          </g>
        </g>
      </svg>
    </div>
  )
}
