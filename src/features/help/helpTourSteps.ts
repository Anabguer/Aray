import type { HubIconId } from '@/assets/icons/hub'

export type HelpTourStepId =
  | 'welcome'
  | 'daily'
  | 'worlds'
  | 'practice'
  | 'tutor'
  | 'energy'

export type HelpTourStep = {
  id: HelpTourStepId
  title: string
  lead: string
  bullets: string[]
  visual: 'lobby' | 'daily' | 'worlds' | 'modes' | 'lock' | 'energy'
  icon: HubIconId
}

/** Pantallas de la guía (niño + tutor). */
export const HELP_TOUR_STEPS: HelpTourStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenidos a AFK Academy!',
    lead: 'Un mundo de misiones para practicar mates y lengua. Tú juegas; el tutor mira el progreso.',
    bullets: [
      'Empieza en el lobby: ahí ves el premio, la energía y las misiones.',
      'Cuando quieras, pulsa el botón ? para volver a ver esta guía.',
    ],
    visual: 'lobby',
    icon: 'misiones',
  },
  {
    id: 'daily',
    title: 'Misión diaria',
    lead: 'En el lobby verás esta tarjeta con burbujas. Son los cupos cortos del día.',
    bullets: [
      'Tablas, cálculo, ortografía, palabras, relojes y dinero.',
      'Toca una burbuja para ir a ese ejercicio. Al completarlas todas hay un reto extra.',
    ],
    visual: 'daily',
    icon: 'misiones',
  },
  {
    id: 'worlds',
    title: 'Mundos y ejercicios',
    lead: 'Para elegir asignatura, en el lobby pulsa el botón «Farmear energía».',
    bullets: [
      'Te lleva a Mis mundos: Matemáticas o Lengua (y más adelante Inglés).',
      'Dentro eliges el tipo: tablas, ortografía, Formar palabras…',
    ],
    visual: 'worlds',
    icon: 'matematicas',
  },
  {
    id: 'practice',
    title: 'Mis fallos y Random',
    lead: 'En casi todos los ejercicios verás dos atajos para practicar mejor.',
    bullets: [
      'Random: elige una mezcla al azar (ideal para el día a día).',
      'Mis fallos: repasa lo que más se te atraganta si has fallado.',
    ],
    visual: 'modes',
    icon: 'tablas',
  },
  {
    id: 'tutor',
    title: 'Candado del tutor',
    lead: 'Los adultos abren el panel familiar con el PIN de 4 dígitos.',
    bullets: [
      'Pulsa el candado (junto al altavoz) e introduce el PIN.',
      'Ahí ves tiempo por día, tablas, ABC, premios y más.',
    ],
    visual: 'lock',
    icon: 'coleccion',
  },
  {
    id: 'energy',
    title: 'Energía y premio',
    lead: 'Jugar bien suma energía del día. Al llegar a la meta, toca entregar el premio.',
    bullets: [
      'Hay un tope diario de energía (para no agotar el día).',
      'El tutor marca el premio como entregado en el panel del candado.',
    ],
    visual: 'energy',
    icon: 'drop_robot',
  },
]
