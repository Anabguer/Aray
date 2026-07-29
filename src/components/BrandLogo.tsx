import arayLogoUrl from '@/assets/brand/aray-logo.png'

type BrandLogoProps = {
  /** Variante visual: hero (inicio), compact (topbar), mark (solo marca pequeña). */
  variant?: 'hero' | 'compact' | 'mark'
  className?: string
  alt?: string
}

export function BrandLogo({
  variant = 'hero',
  className,
  alt = 'ARAY',
}: BrandLogoProps) {
  return (
    <img
      src={arayLogoUrl}
      alt={alt}
      className={['brand-logo', `brand-logo--${variant}`, className].filter(Boolean).join(' ')}
      draggable={false}
      decoding="async"
    />
  )
}
