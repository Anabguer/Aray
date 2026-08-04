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
import moneyBuild from './money-build.png'
import moneyChange from './money-change.png'
import moneyMix from './money-mix.png'
import moneySpare from './money-spare.png'
import moneySum from './money-sum.png'
import retoRapido from './reto-rapido.png'
import sorpresa from './sorpresa.png'
import spellComplete from './spell-complete.png'
import spellCorrect from './spell-correct.png'
import spellIntruder from './spell-intruder.png'
import spellMissing from './spell-missing.png'
import spellMix from './spell-mix.png'
import spellPicture from './spell-picture.png'
import wordsAntonimos from './words-antonimos.png'
import wordsClasifica from './words-clasifica.png'
import wordsComunPropio from './words-comun-propio.png'
import wordsFormar from './words-formar.png'
import wordsGender from './words-gender.png'
import wordsMontaFrase from './words-monta-frase.png'
import wordsPlural from './words-plural.png'
import wordsQuienHaceQue from './words-quien-hace-que.png'
import wordsSinonimos from './words-sinonimos.png'
import wordsSinonimosAntonimos from './words-sinonimos-antonimos.png'
import englishFood from './english-food.png'
import englishNumbers from './english-numbers.png'
import englishPlaces from './english-places.png'
import englishWeather from './english-weather.png'
import englishCharacters from './english-characters.png'
import englishTransport from './english-transport.png'
import englishThereIs from './english-there-is.png'
import englishPrepositions from './english-prepositions.png'
import englishAbilities from './english-abilities.png'
import englishRoutines from './english-routines.png'
import englishMoney from './english-money.png'
import englishPossessives from './english-possessives.png'

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
  | 'money-mix'
  | 'money-change'
  | 'money-build'
  | 'money-spare'
  | 'money-sum'
  | 'clock-learn'
  | 'clock-train'
  | 'clock-match'
  | 'spell-missing'
  | 'spell-correct'
  | 'spell-picture'
  | 'spell-intruder'
  | 'spell-complete'
  | 'spell-mix'
  | 'words-formar'
  | 'words-plural'
  | 'words-gender'
  | 'words-sinonimos'
  | 'words-antonimos'
  | 'words-sinonimos-antonimos'
  | 'words-clasifica'
  | 'words-monta-frase'
  | 'words-quien-hace-que'
  | 'words-comun-propio'
  | 'english-food'
  | 'english-numbers'
  | 'english-places'
  | 'english-weather'
  | 'english-characters'
  | 'english-transport'
  | 'english-there-is'
  | 'english-prepositions'
  | 'english-abilities'
  | 'english-routines'
  | 'english-money'
  | 'english-possessives'

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
  'money-mix': moneyMix,
  'money-change': moneyChange,
  'money-build': moneyBuild,
  'money-spare': moneySpare,
  'money-sum': moneySum,
  'clock-learn': clockLearn,
  'clock-train': clockTrain,
  'clock-match': clockMatch,
  'spell-missing': spellMissing,
  'spell-correct': spellCorrect,
  'spell-picture': spellPicture,
  'spell-intruder': spellIntruder,
  'spell-complete': spellComplete,
  'spell-mix': spellMix,
  'words-formar': wordsFormar,
  'words-plural': wordsPlural,
  'words-gender': wordsGender,
  'words-sinonimos': wordsSinonimos,
  'words-antonimos': wordsAntonimos,
  'words-sinonimos-antonimos': wordsSinonimosAntonimos,
  'words-clasifica': wordsClasifica,
  'words-monta-frase': wordsMontaFrase,
  'words-quien-hace-que': wordsQuienHaceQue,
  'words-comun-propio': wordsComunPropio,
  'english-food': englishFood,
  'english-numbers': englishNumbers,
  'english-places': englishPlaces,
  'english-weather': englishWeather,
  'english-characters': englishCharacters,
  'english-transport': englishTransport,
  'english-there-is': englishThereIs,
  'english-prepositions': englishPrepositions,
  'english-abilities': englishAbilities,
  'english-routines': englishRoutines,
  'english-money': englishMoney,
  'english-possessives': englishPossessives,
}

export function modeArtUrl(id: ModeArtId): string {
  return modeArt[id]
}
