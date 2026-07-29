import aprendeUrl from '@/assets/icons/modes/aprende.svg'
import emparejaUrl from '@/assets/icons/modes/empareja.svg'
import entrenaUrl from '@/assets/icons/modes/entrena.svg'
import misFallosUrl from '@/assets/icons/modes/mis-fallos.svg'
import misionRandomUrl from '@/assets/icons/modes/mision-random.svg'
import retoRapidoUrl from '@/assets/icons/modes/reto-rapido.svg'

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
  'mision-random': misionRandomUrl,
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
