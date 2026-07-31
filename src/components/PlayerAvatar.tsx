import { BrandLogo } from '@/components/BrandLogo'

type Props = {
  url?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/** Avatar del niño activo o fallback al logo de marca. */
export function PlayerAvatar({ url, name, size = 'md', className = '' }: Props) {
  const sizeClass =
    size === 'lg' ? 'player-avatar--lg' : size === 'sm' ? 'player-avatar--sm' : ''
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`player-avatar ${sizeClass} ${className}`.trim()}
      />
    )
  }
  return (
    <BrandLogo
      variant={size === 'lg' ? 'hero' : 'compact'}
      className={`player-avatar player-avatar--brand ${sizeClass} ${className}`.trim()}
      alt={name}
    />
  )
}
