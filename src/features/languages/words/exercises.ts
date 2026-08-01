/**
 * Catálogo de ejercicios de la categoría Palabras.
 * Añadir un ejercicio aquí + su ruta basta para que aparezca en la selección
 * sin tocar la navegación del hub.
 */
import type { ModeArtId } from '@/assets/modes'

export type WordsExerciseId = 'formar-palabras'

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
    art: 'abc-letras',
    className: 'mode-poster--learn',
    tag: '01',
    href: '/missions/languages/formar-palabras',
    status: 'active',
    featured: true,
  },
]

export function activeWordsExercises(): WordsExercise[] {
  return WORDS_EXERCISES.filter((e) => e.status === 'active')
}

export function wordsExerciseHref(exercise: WordsExercise): string {
  return exercise.href
}
