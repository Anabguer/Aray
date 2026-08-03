/**
 * Catálogo de ejercicios de la categoría Palabras.
 * Añadir un ejercicio aquí + su ruta basta para que aparezca en la selección
 * sin tocar la navegación del hub.
 */
import type { ModeArtId } from '@/assets/modes'

export type WordsExerciseId =
  | 'formar-palabras'
  | 'clasifica'
  | 'sinonimos'
  | 'antonimos'
  | 'monta-frase'
  | 'quien-hace-que'
  | 'comun-propio'

export type WordsExerciseStatus = 'active' | 'coming-soon'

export type WordsExercise = {
  id: WordsExerciseId
  title: string
  text: string
  art: ModeArtId
  className: string
  tag: string
  /** Ruta absoluta del minijuego (p. ej. /missions/languages/formar-palabras). */
  href: string
  status: WordsExerciseStatus
  featured?: boolean
}

export const WORDS_EXERCISES: WordsExercise[] = [
  {
    id: 'formar-palabras',
    title: 'Formar palabras',
    text: 'Ordena letras y forma la palabra',
    art: 'words-formar',
    className: 'mode-poster--learn',
    tag: '01',
    href: '/missions/languages/formar-palabras',
    status: 'active',
    featured: true,
  },
  {
    id: 'clasifica',
    title: 'Clasifica',
    text: 'Una/muchas, el/la y artículos',
    art: 'words-clasifica',
    className: 'mode-poster--train',
    tag: '02',
    href: '/missions/languages/words/clasifica',
    status: 'active',
  },
  {
    id: 'sinonimos',
    title: 'Sinónimos',
    text: 'Elige una palabra que signifique lo mismo',
    art: 'words-sinonimos',
    className: 'mode-poster--learn',
    tag: '03',
    href: '/missions/languages/words/sinonimos',
    status: 'active',
  },
  {
    id: 'antonimos',
    title: 'Antónimos',
    text: 'Elige una palabra con el sentido contrario',
    art: 'words-antonimos',
    className: 'mode-poster--train',
    tag: '04',
    href: '/missions/languages/words/antonimos',
    status: 'active',
  },
  {
    id: 'monta-frase',
    title: 'Monta la frase',
    text: 'Ordena las palabras y forma la oración',
    art: 'words-monta-frase',
    className: 'mode-poster--challenge',
    tag: '05',
    href: '/missions/languages/words/monta-frase',
    status: 'active',
  },
  {
    id: 'quien-hace-que',
    title: 'Quién hace qué',
    text: 'Une el pronombre con su verbo',
    art: 'words-quien-hace-que',
    className: 'mode-poster--learn',
    tag: '06',
    href: '/missions/languages/words/quien-hace-que',
    status: 'active',
  },
  {
    id: 'comun-propio',
    title: 'Común o propio',
    text: 'Une el tipo con su nombre propio',
    art: 'words-comun-propio',
    className: 'mode-poster--train',
    tag: '07',
    href: '/missions/languages/words/comun-propio',
    status: 'active',
  },
]

export function activeWordsExercises(): WordsExercise[] {
  return WORDS_EXERCISES.filter((e) => e.status === 'active')
}

export function wordsExerciseHref(exercise: WordsExercise): string {
  return exercise.href
}
