import type { DemoMissionOfDay, DemoProfile, SubjectPreview, ZoneLink } from './types'

/** Datos de demostración — no son progreso real ni backend. */
export const demoProfile: DemoProfile = {
  displayName: 'Aray',
  greeting: '¡Hola, Aray!',
  xp: 120,
  xpGoal: 200,
  coins: 45,
}

export const demoMissionOfDay: DemoMissionOfDay = {
  title: 'Tu misión de hoy',
  subjectId: 'mates',
  subjectLabel: 'Matemáticas',
  hint: 'Practica las tablas de multiplicar: aprende, entrena o lanza un reto rápido.',
}

export const zoneLinks: ZoneLink[] = [
  {
    id: 'missions',
    title: 'Mis mundos',
    description: 'Entrena por asignaturas',
    status: 'active',
    path: '/missions',
  },
  {
    id: 'collection',
    title: 'Mi colección',
    description: 'Logros y premios',
    status: 'active',
    path: '/collection',
  },
]

export const subjectPreviews: SubjectPreview[] = [
  {
    id: 'mates',
    title: 'Matemáticas',
    shortLabel: 'Mates',
    description: 'Números, tablas y retos',
    accent: 'mates',
  },
  {
    id: 'catala',
    title: 'Catalán',
    shortLabel: 'Català',
    description: 'Lectura, ortografía y expresión',
    accent: 'catala',
  },
  {
    id: 'castellano',
    title: 'Castellano',
    shortLabel: 'Castellano',
    description: 'Comprensión, vocabulario y escritura',
    accent: 'castellano',
  },
  {
    id: 'angles',
    title: 'Inglés',
    shortLabel: 'English',
    description: 'Vocabulario y frases útiles',
    accent: 'angles',
  },
  {
    id: 'medi',
    title: 'Medio',
    shortLabel: 'Medio',
    description: 'Naturaleza, sociedad y cultura',
    accent: 'medi',
  },
]

export const comingSoonCopy: Record<string, { title: string; body: string }> = {
  collection: {
    title: 'Mi colección',
    body: 'Aquí aparecerán los tesoros y recompensas que vayas consiguiendo. Todavía no está listo.',
  },
  subject: {
    title: 'Asignatura',
    body: 'Las actividades jugables de esta asignatura llegarán pronto. Por ahora solo es una vista previa.',
  },
}
