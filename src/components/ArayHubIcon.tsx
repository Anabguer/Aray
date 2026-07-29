import { hubIconUrl, type HubIconId } from '@/assets/icons/hub'

const INTRINSIC = 418

type ArayHubIconProps = {
  id: HubIconId
  /** Tamaño CSS (px o rem vía className). Reserva layout con width/height intrínsecos. */
  className?: string
  /** Prioridad de carga (misión principal). */
  priority?: boolean
  /** Decorativo: alt vacío. Si false, usa `label` como alt. */
  decorative?: boolean
  /** Nombre accesible cuando no es decorativo. */
  label?: string
}

export function ArayHubIcon({
  id,
  className,
  priority = false,
  decorative = true,
  label,
}: ArayHubIconProps) {
  return (
    <img
      src={hubIconUrl(id)}
      alt={decorative ? '' : (label ?? '')}
      width={INTRINSIC}
      height={INTRINSIC}
      className={['aray-hub-icon', className].filter(Boolean).join(' ')}
      draggable={false}
      decoding="async"
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
    />
  )
}
