import abcFalta from './abc-falta.png'
import abcLetras from './abc-letras.png'
import abcPalabras from './abc-palabras.png'
import abcRandom from './abc-random.png'
import abcVecina from './abc-vecina.png'
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
  | 'abc-falta'
  | 'abc-vecina'
  | 'abc-letras'
  | 'abc-palabras'
  | 'abc-random'

/** Arte 3D gamer por modo (cuadrado, object-fit cover). */
export const modeArt: Record<ModeArtId, string> = {
  aprende,
  entrena,
  'reto-rapido': retoRapido,
  empareja,
  sorpresa,
  'mis-fallos': misFallos,
  'mision-random': sorpresa,
  'abc-falta': abcFalta,
  'abc-vecina': abcVecina,
  'abc-letras': abcLetras,
  'abc-palabras': abcPalabras,
  'abc-random': abcRandom,
}

export function modeArtUrl(id: ModeArtId): string {
  return modeArt[id]
}
