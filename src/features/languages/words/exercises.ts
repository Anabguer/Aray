/**
 * Catálogo de ejercicios de la categoría Palabras.
 * Añadir un ejercicio aquí + su ruta basta para que aparezca en la selección
 * sin tocar la navegación del hub.
 */
import type { ModeArtId } from '@/assets/modes'

export type WordsExerciseId =
  | 'formar-palabras'
  | 'singular-plural'
  | 'masculino-femenino'
  | 'sinonimos'
  | 'antonimos'

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
    id: 'singular-plural',
    title: 'Singular / plural',
    text: 'Cambia el número de la palabra',
    art: 'words-plural',
    className: 'mode-poster--train',
    tag: '02',
    href: '/missions/languages/words/singular-plural',
    status: 'active',
  },
  {
    id: 'masculino-femenino',
    title: 'Masculino / femenino',
    text: 'Cambia el género de la palabra',
    art: 'words-gender',
    className: 'mode-poster--challenge',
    tag: '03',
    href: '/missions/languages/words/masculino-femenino',
    status: 'active',
  },
  {
    id: 'sinonimos',
    title: 'Sinónimos',
    text: 'Elige una palabra que signifique lo mismo',
    art: 'words-sinonimos',
    className: 'mode-poster--learn',
    tag: '04',
    href: '/missions/languages/words/sinonimos',
    status: 'active',
  },
  {
    id: 'antonimos',
    title: 'Antónimos',
    text: 'Elige una palabra con el sentido contrario',
    art: 'words-antonimos',
    className: 'mode-poster--train',
    tag: '05',
    href: '/missions/languages/words/antonimos',
    status: 'active',
  },
]

export function activeWordsExercises(): WordsExercise[] {
  return WORDS_EXERCISES.filter((e) => e.status === 'active')
}

export function wordsExerciseHref(exercise: WordsExercise): string {
  return exercise.href
}
