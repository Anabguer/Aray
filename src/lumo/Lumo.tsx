import lumoArtUrl from '@/assets/lumo.png'
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
      <span className="lumo__shadow" aria-hidden="true" />
      <div className="lumo__figure" aria-hidden="true">
        <img className="lumo__art" src={lumoArtUrl} alt="" draggable={false} decoding="async" />
        <span className="lumo__core" />
      </div>
    </div>
  )
}
