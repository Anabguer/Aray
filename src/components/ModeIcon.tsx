import aprendeUrl from '@/assets/modes/aprende.png'
import emparejaUrl from '@/assets/modes/empareja.png'
import entrenaUrl from '@/assets/modes/entrena.png'
import misFallosUrl from '@/assets/modes/mis-fallos.png'
import sorpresaUrl from '@/assets/modes/sorpresa.png'
import retoRapidoUrl from '@/assets/modes/reto-rapido.png'

export type ModeIconId =
  | 'aprende'
  | 'entrena'
  | 'reto-rapido'
  | 'mis-fallos'
  | 'empareja'
  | 'mision-random'

const MODE_ICON_URLS: Record<ModeIconId, string> = {
  aprende: aprendeUrl,
  entrena: entrenaUrl,
  'reto-rapido': retoRapidoUrl,
  'mis-fallos': misFallosUrl,
  empareja: emparejaUrl,
  'mision-random': sorpresaUrl,
}

type ModeIconProps = {
  mode: ModeIconId
  className?: string
}

/** Icono decorativo de modo (el nombre accesible va en la tarjeta). */
export function ModeIcon({ mode, className }: ModeIconProps) {
  return (
    <span className={['mode-icon', className].filter(Boolean).join(' ')} aria-hidden="true">
      <img src={MODE_ICON_URLS[mode]} alt="" draggable={false} width={56} height={56} />
    </span>
  )
}
