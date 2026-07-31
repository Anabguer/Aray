import abcFalta from './abc-falta.png'
import abcLetras from './abc-letras.png'
import abcPalabras from './abc-palabras.png'
import abcRandom from './abc-random.png'
import abcVecina from './abc-vecina.png'
import aprende from './aprende.png'
import calcAdd from './calc-add.png'
import calcCompare from './calc-compare.png'
import calcDoubles from './calc-doubles.png'
import calcHalves from './calc-halves.png'
import calcMissing from './calc-missing.png'
import calcMix from './calc-mix.png'
import calcNear10 from './calc-near10.png'
import calcOrder from './calc-order.png'
import calcSub from './calc-sub.png'
import calcTruefalse from './calc-truefalse.png'
import clockLearn from './clock-learn.webp'
import clockMatch from './clock-match.webp'
import clockTrain from './clock-train.webp'
import empareja from './empareja.png'
import entrena from './entrena.png'
import misFallos from './mis-fallos.png'
import retoRapido from './reto-rapido.png'
import sorpresa from './sorpresa.png'
import spellComplete from './spell-complete.png'
import spellCorrect from './spell-correct.png'
import spellIntruder from './spell-intruder.png'
import spellMissing from './spell-missing.png'
import spellMix from './spell-mix.png'
import spellPicture from './spell-picture.png'

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
  | 'calc-mix'
  | 'calc-add'
  | 'calc-sub'
  | 'calc-missing'
  | 'calc-doubles'
  | 'calc-halves'
  | 'calc-near10'
  | 'calc-compare'
  | 'calc-order'
  | 'calc-truefalse'
  | 'clock-learn'
  | 'clock-train'
  | 'clock-match'
  | 'spell-missing'
  | 'spell-correct'
  | 'spell-picture'
  | 'spell-intruder'
  | 'spell-complete'
  | 'spell-mix'

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
  'calc-mix': calcMix,
  'calc-add': calcAdd,
  'calc-sub': calcSub,
  'calc-missing': calcMissing,
  'calc-doubles': calcDoubles,
  'calc-halves': calcHalves,
  'calc-near10': calcNear10,
  'calc-compare': calcCompare,
  'calc-order': calcOrder,
  'calc-truefalse': calcTruefalse,
  'clock-learn': clockLearn,
  'clock-train': clockTrain,
  'clock-match': clockMatch,
  'spell-missing': spellMissing,
  'spell-correct': spellCorrect,
  'spell-picture': spellPicture,
  'spell-intruder': spellIntruder,
  'spell-complete': spellComplete,
  'spell-mix': spellMix,
}

export function modeArtUrl(id: ModeArtId): string {
  return modeArt[id]
}
