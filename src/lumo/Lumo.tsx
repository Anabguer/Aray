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
  const rimGrad = `lumoRim-${uid}`

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
          <radialGradient id={bodyGrad} cx="32%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="45%" stopColor="#0f2744" />
            <stop offset="100%" stopColor="#07111f" />
          </radialGradient>
          <radialGradient id={bellyGrad} cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="var(--lumo-belly-hi)" />
            <stop offset="100%" stopColor="var(--lumo-belly-lo)" />
          </radialGradient>
          <linearGradient id={limbGrad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="55%" stopColor="#164e63" />
            <stop offset="100%" stopColor="#0b1f3a" />
          </linearGradient>
          <linearGradient id={rimGrad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
        </defs>

        <ellipse className="lumo__shadow" cx="60" cy="112" rx="30" ry="5.5" />

        <g className="lumo__figure">
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
            stroke={`url(#${rimGrad})`}
            strokeWidth="1.6"
          />

          {/* Orejas más angulares, look gamer */}
          <g className="lumo__ears">
            <path
              className="lumo__ear lumo__ear--l"
              d="M47 28 L38 10 L52 22 Z"
              fill={`url(#${bodyGrad})`}
              stroke={`url(#${rimGrad})`}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path
              className="lumo__ear lumo__ear--r"
              d="M73 28 L82 10 L68 22 Z"
              fill={`url(#${bodyGrad})`}
              stroke={`url(#${rimGrad})`}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </g>

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
            <ellipse className="lumo__eye lumo__eye--l" cx="46" cy="45" rx="5.2" ry="6.2" />
            <ellipse className="lumo__eye lumo__eye--r" cx="74" cy="45" rx="5.2" ry="6.2" />
            <g className="lumo__pupils">
              <circle className="lumo__pupil lumo__pupil--l" cx="47.8" cy="46.2" r="2.15" />
              <circle className="lumo__pupil lumo__pupil--r" cx="75.8" cy="46.2" r="2.15" />
            </g>
            {/* Sonrisa traviesa asimétrica */}
            <path className="lumo__mouth" d="M52 56.5c2.2 3.8 9.5 5.2 15.5 1.2" />
            <path className="lumo__mouth-oops" d="M57 56.5c0 3.2 6 3.2 6 0" />
            <circle className="lumo__blush lumo__blush--l" cx="36" cy="55" r="3.5" />
            <circle className="lumo__blush lumo__blush--r" cx="84" cy="55" r="3.5" />
          </g>
        </g>
      </svg>
    </div>
  )
}
