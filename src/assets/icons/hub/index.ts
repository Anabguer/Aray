import castellano from './castellano.png'
import catalan from './catalan.png'
import coleccion from './coleccion.png'
import dropRobot from './drop_robot.png'
import ingles from './ingles.png'
import matematicas from './matematicas.png'
import medi from './medi.png'
import misiones from './misiones.png'
import tablas from './tablas.png'

/** Identificadores de la familia de iconos de lobby / asignaturas. */
export type HubIconId =
  | 'matematicas'
  | 'catalan'
  | 'castellano'
  | 'ingles'
  | 'medi'
  | 'tablas'
  | 'misiones'
  | 'coleccion'
  | 'drop_robot'

const HUB_ICON_URLS: Record<HubIconId, string> = {
  matematicas,
  catalan,
  castellano,
  ingles,
  medi,
  tablas,
  misiones,
  coleccion,
  drop_robot: dropRobot,
}

/** Fallback coherente (mismo pack, no emoji) si falta un id. */
const FALLBACK_ICON: HubIconId = 'misiones'

export function hubIconUrl(id: HubIconId): string {
  const url = HUB_ICON_URLS[id]
  if (!url) {
    console.error(`[ARAY] Falta icono de hub: ${id}`)
    return HUB_ICON_URLS[FALLBACK_ICON]
  }
  return url
}

export const hubIconIds = Object.keys(HUB_ICON_URLS) as HubIconId[]
