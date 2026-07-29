import aprende from './aprende.png'
import empareja from './empareja.png'
import entrena from './entrena.png'
import misFallos from './mis-fallos.png'
import retoRapido from './reto-rapido.png'
import sorpresa from './sorpresa.png'

export type ModeArtId =
  | 'aprende'
  | 'entrena'
  | 'reto-rapido'
  | 'empareja'
  | 'sorpresa'
  | 'mis-fallos'
  | 'mision-random'

/** Arte 3D gamer por modo (cuadrado, object-fit cover). */
export const modeArt: Record<ModeArtId, string> = {
  aprende,
  entrena,
  'reto-rapido': retoRapido,
  empareja,
  sorpresa,
  'mis-fallos': misFallos,
  'mision-random': sorpresa,
}

export function modeArtUrl(id: ModeArtId): string {
  return modeArt[id]
}
