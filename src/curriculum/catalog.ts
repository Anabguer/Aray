import type {
  ActivityDefinition,
  BlockDefinition,
  CourseActivityAssignment,
  CourseDefinition,
  CourseId,
  SkillDefinition,
  SubjectDefinition,
} from '@/curriculum/types'
import { PLAYABLE_TABLES } from '@/config/playConfig'

export const DEFAULT_COURSE_ID: CourseId = 'primary-3'

export const courses: CourseDefinition[] = [
  {
    id: 'primary-3',
    title: '3.º de Primaria',
    shortTitle: '3.º',
    stage: 'primary',
    grade: 3,
    status: 'active',
    sortOrder: 30,
  },
  {
    id: 'primary-4',
    title: '4.º de Primaria',
    shortTitle: '4.º',
    stage: 'primary',
    grade: 4,
    status: 'active',
    sortOrder: 40,
  },
  {
    id: 'primary-5',
    title: '5.º de Primaria',
    shortTitle: '5.º',
    stage: 'primary',
    grade: 5,
    status: 'future',
    sortOrder: 50,
  },
]

export const subjects: SubjectDefinition[] = [
  {
    id: 'maths',
    title: 'Matemáticas',
    shortTitle: 'Mates',
    description: 'Números, tablas y retos',
    legacyHubId: 'mates',
    worldPath: '/missions/mates',
    status: 'active',
    sortOrder: 10,
  },
  {
    id: 'languages',
    title: 'Lenguas',
    shortTitle: 'Lenguas',
    description: 'Leer, escribir y expresar',
    legacyHubId: 'catala',
    worldPath: '/missions/languages',
    status: 'active',
    sortOrder: 20,
  },
  {
    id: 'english',
    title: 'Inglés',
    shortTitle: 'English',
    description: 'Vocabulario y frases útiles',
    legacyHubId: 'angles',
    worldPath: '/missions/english',
    status: 'active',
    sortOrder: 30,
  },
]

/** Estructura preparada: solo multiplication-tables tiene actividades reales. */
export const blocks: BlockDefinition[] = [
  {
    id: 'multiplication-tables',
    subjectId: 'maths',
    title: 'Tablas de multiplicar',
    description: 'Dominar las tablas del 2 al 9',
    status: 'active',
    sortOrder: 10,
  },
  {
    id: 'calculation',
    subjectId: 'maths',
    title: 'Cálculo',
    description: 'Operaciones y agilidad numérica',
    status: 'future',
    sortOrder: 20,
  },
  {
    id: 'problems',
    subjectId: 'maths',
    title: 'Problemas',
    description: 'Resolver situaciones con números',
    status: 'future',
    sortOrder: 30,
  },
  {
    id: 'clocks-hours',
    subjectId: 'maths',
    title: 'Relojes y horas',
    description: 'Leer la hora en castellano y catalán',
    status: 'active',
    sortOrder: 40,
  },
  {
    id: 'alphabet',
    subjectId: 'languages',
    title: 'ABC',
    description: 'Letras y sonidos',
    status: 'active',
    sortOrder: 10,
  },
  {
    id: 'writing',
    subjectId: 'languages',
    title: 'Escritura',
    description: 'Escribir con claridad',
    status: 'future',
    sortOrder: 20,
  },
  {
    id: 'comprehension',
    subjectId: 'languages',
    title: 'Comprensión',
    description: 'Entender textos',
    status: 'future',
    sortOrder: 30,
  },
  {
    id: 'spelling',
    subjectId: 'languages',
    title: 'Ortografía',
    description: 'Escribir correctamente',
    status: 'future',
    sortOrder: 40,
  },
  {
    id: 'vocabulary',
    subjectId: 'english',
    title: 'Vocabulario',
    description: 'Palabras nuevas',
    status: 'future',
    sortOrder: 10,
  },
  {
    id: 'word-image',
    subjectId: 'english',
    title: 'Relacionar palabra e imagen',
    description: 'Emparejar palabras e imágenes',
    status: 'future',
    sortOrder: 20,
  },
  {
    id: 'simple-phrases',
    subjectId: 'english',
    title: 'Frases sencillas',
    description: 'Construir frases cortas',
    status: 'future',
    sortOrder: 30,
  },
]

function buildTableSkills(): SkillDefinition[] {
  return PLAYABLE_TABLES.map((n, index) => ({
    id: `mult-table-${n}`,
    blockId: 'multiplication-tables' as const,
    title: `Tabla del ${n}`,
    description: `Multiplicar por ${n}`,
    progressKey: String(n),
    progressKind: 'multiplication-table' as const,
    recommendedCourses: ['primary-3', 'primary-4'] as CourseId[],
    status: 'active' as const,
    sortOrder: (index + 1) * 10,
  }))
}

export const skills: SkillDefinition[] = [
  ...buildTableSkills(),
  {
    id: 'mult-mix-2-9',
    blockId: 'multiplication-tables',
    title: 'Mezcla 2–9',
    description: 'Practicar varias tablas a la vez',
    progressKey: 'mix-2-9',
    progressKind: 'multiplication-table',
    recommendedCourses: ['primary-3', 'primary-4'],
    status: 'active',
    sortOrder: 100,
  },
  {
    id: 'clock-hours',
    blockId: 'clocks-hours',
    title: 'Leer la hora',
    description: 'Reloj analógico en castellano y catalán (campanar)',
    progressKey: 'clock-hours',
    progressKind: 'generic',
    recommendedCourses: ['primary-3', 'primary-4'],
    status: 'active',
    sortOrder: 10,
  },
  {
    id: 'alphabet-letters',
    blockId: 'alphabet',
    title: 'ABC',
    description: 'Repasar letras A–Z y Ñ',
    progressKey: 'alphabet-letters',
    progressKind: 'generic',
    recommendedCourses: ['primary-3', 'primary-4'],
    status: 'active',
    sortOrder: 10,
  },
]

const defaultRewards = { xpWeight: 1, coinWeight: 1, energyWeight: 1 }

function tableActivitiesFor(table: number): ActivityDefinition[] {
  const skillId = `mult-table-${table}`
  const base = `/missions/mates/tables`
  return [
    {
      id: `mult-table-${table}-learn`,
      title: `Aprende la tabla del ${table}`,
      description: 'Repasa la tabla sin prisa',
      skillId,
      exerciseType: 'learn',
      difficulty: 'basic',
      status: 'active',
      sortOrder: table * 10 + 1,
      rewards: { ...defaultRewards, energyWeight: 0 },
      config: {
        playMode: 'learn',
        table: table,
        path: `${base}/learn`,
        selectPath: `${base}/modes`,
        tablesSelectPath: base,
      },
    },
    {
      id: `mult-table-${table}-train`,
      title: `Entrena la tabla del ${table}`,
      description: 'Completa la ronda a tu ritmo',
      skillId,
      exerciseType: 'complete',
      difficulty: 'basic',
      status: 'active',
      sortOrder: table * 10 + 2,
      rewards: defaultRewards,
      config: {
        playMode: 'train',
        table: table,
        path: `${base}/train`,
        selectPath: `${base}/modes`,
        tablesSelectPath: base,
      },
    },
    {
      id: `mult-table-${table}-challenge`,
      title: `Reto de la tabla del ${table}`,
      description: 'Contrarreloj: responde rápido',
      skillId,
      exerciseType: 'timed',
      difficulty: 'medium',
      status: 'active',
      sortOrder: table * 10 + 3,
      rewards: { xpWeight: 1.2, coinWeight: 1.2, energyWeight: 1.2 },
      config: {
        playMode: 'challenge',
        table: table,
        path: `${base}/challenge`,
        selectPath: `${base}/modes`,
        tablesSelectPath: base,
      },
    },
    {
      id: `mult-table-${table}-match`,
      title: `Empareja la tabla del ${table}`,
      description: 'Relaciona operaciones y resultados',
      skillId,
      exerciseType: 'match',
      difficulty: 'basic',
      status: 'active',
      sortOrder: table * 10 + 4,
      rewards: defaultRewards,
      config: {
        playMode: 'match',
        table: table,
        path: `${base}/match`,
        selectPath: `${base}/modes`,
        tablesSelectPath: base,
      },
    },
  ]
}

export const activities: ActivityDefinition[] = [
  ...PLAYABLE_TABLES.flatMap((n) => tableActivitiesFor(n)),
  {
    id: 'mult-misses-practice',
    title: 'Mis fallos',
    description: 'Repasa las operaciones que más cuestan',
    skillId: 'mult-mix-2-9',
    exerciseType: 'spot-error',
    difficulty: 'medium',
    status: 'active',
    sortOrder: 900,
    rewards: defaultRewards,
    config: {
      playMode: 'misses',
      path: '/missions/mates/tables/train',
      selectPath: '/missions/mates/tables/modes',
      tablesSelectPath: '/missions/mates/tables',
    },
  },
  {
    id: 'mult-random-mission',
    title: 'Misión random',
    description: 'Una misión sorpresa con tablas',
    skillId: 'mult-mix-2-9',
    exerciseType: 'mixed',
    difficulty: 'medium',
    status: 'active',
    sortOrder: 910,
    rewards: defaultRewards,
    config: {
      playMode: 'random',
      path: '/missions/mates/tables/modes',
      selectPath: '/missions/mates/tables/modes',
      tablesSelectPath: '/missions/mates/tables',
    },
  },
  {
    id: 'clock-hours-learn',
    title: 'Aprende las horas',
    description: 'Lumo te enseña a leer el reloj en castellano o catalán',
    skillId: 'clock-hours',
    exerciseType: 'learn',
    difficulty: 'basic',
    status: 'active',
    sortOrder: 500,
    rewards: { ...defaultRewards, energyWeight: 0 },
    config: {
      playMode: 'learn',
      path: '/missions/mates/clocks/learn',
      selectPath: '/missions/mates/clocks',
      clocksPath: '/missions/mates/clocks',
    },
  },
  {
    id: 'clock-hours-train',
    title: 'Entrena las horas',
    description: 'Mira el reloj y elige la frase correcta',
    skillId: 'clock-hours',
    exerciseType: 'multiple-choice',
    difficulty: 'basic',
    status: 'active',
    sortOrder: 510,
    rewards: defaultRewards,
    config: {
      playMode: 'train',
      path: '/missions/mates/clocks/train',
      selectPath: '/missions/mates/clocks',
      clocksPath: '/missions/mates/clocks',
    },
  },
  {
    id: 'clock-hours-match',
    title: 'Empareja las horas',
    description: 'Relaciona relojes con la hora escrita',
    skillId: 'clock-hours',
    exerciseType: 'match',
    difficulty: 'basic',
    status: 'active',
    sortOrder: 520,
    rewards: defaultRewards,
    config: {
      playMode: 'match',
      path: '/missions/mates/clocks/match',
      selectPath: '/missions/mates/clocks',
      clocksPath: '/missions/mates/clocks',
    },
  },
  {
    id: 'alphabet-missing',
    title: 'Letra que falta',
    description: 'Completa la cadena del abecedario',
    skillId: 'alphabet-letters',
    exerciseType: 'multiple-choice',
    difficulty: 'basic',
    status: 'active',
    sortOrder: 600,
    rewards: defaultRewards,
    config: {
      playMode: 'missing',
      path: '/missions/languages/alphabet/missing',
      selectPath: '/missions/languages/alphabet',
      alphabetPath: '/missions/languages/alphabet',
    },
  },
  {
    id: 'alphabet-neighbor',
    title: 'Siguiente o anterior',
    description: 'Lumo saca una letra y tú eliges la vecina',
    skillId: 'alphabet-letters',
    exerciseType: 'multiple-choice',
    difficulty: 'basic',
    status: 'active',
    sortOrder: 610,
    rewards: defaultRewards,
    config: {
      playMode: 'neighbor',
      path: '/missions/languages/alphabet/neighbor',
      selectPath: '/missions/languages/alphabet',
      alphabetPath: '/missions/languages/alphabet',
    },
  },
  {
    id: 'alphabet-order-letters',
    title: 'Ordena letras',
    description: 'Ordena letras de la A a la Z',
    skillId: 'alphabet-letters',
    exerciseType: 'complete',
    difficulty: 'basic',
    status: 'active',
    sortOrder: 620,
    rewards: defaultRewards,
    config: {
      playMode: 'order-letters',
      path: '/missions/languages/alphabet/order-letters',
      selectPath: '/missions/languages/alphabet',
      alphabetPath: '/missions/languages/alphabet',
    },
  },
  {
    id: 'alphabet-order-words',
    title: 'Ordena palabras',
    description: 'Ordena palabras A→Z o Z→A',
    skillId: 'alphabet-letters',
    exerciseType: 'complete',
    difficulty: 'medium',
    status: 'active',
    sortOrder: 630,
    rewards: defaultRewards,
    config: {
      playMode: 'order-words',
      path: '/missions/languages/alphabet/order-words',
      selectPath: '/missions/languages/alphabet',
      alphabetPath: '/missions/languages/alphabet',
    },
  },
  {
    id: 'alphabet-random',
    title: 'ABC random',
    description: 'Cada ronda un juego distinto de letras',
    skillId: 'alphabet-letters',
    exerciseType: 'mixed',
    difficulty: 'medium',
    status: 'active',
    sortOrder: 640,
    rewards: defaultRewards,
    config: {
      playMode: 'random',
      path: '/missions/languages/alphabet/random',
      selectPath: '/missions/languages/alphabet',
      alphabetPath: '/missions/languages/alphabet',
    },
  },
]

/** Asignación por curso: misma actividad, sin copiar progreso. */
export const courseActivityAssignments: CourseActivityAssignment[] = [
  ...activities
    .filter((a) => a.status === 'active')
    .map((a, index) => ({
      courseId: 'primary-3' as CourseId,
      activityId: a.id,
      role: 'recommended' as const,
      sortOrder: a.sortOrder || index + 1,
    })),
  // En 4.º las tablas siguen disponibles como refuerzo / repaso (sin duplicar).
  ...activities
    .filter((a) => a.status === 'active')
    .map((a, index) => ({
      courseId: 'primary-4' as CourseId,
      activityId: a.id,
      role: 'review' as const,
      sortOrder: a.sortOrder || index + 1,
    })),
]

export function getCourse(id: CourseId): CourseDefinition | undefined {
  return courses.find((c) => c.id === id)
}

export function getSubject(id: string): SubjectDefinition | undefined {
  return subjects.find((s) => s.id === id)
}

export function getBlock(id: string): BlockDefinition | undefined {
  return blocks.find((b) => b.id === id)
}

export function getSkill(id: string): SkillDefinition | undefined {
  return skills.find((s) => s.id === id)
}

export function getActivity(id: string): ActivityDefinition | undefined {
  return activities.find((a) => a.id === id)
}

export function activitiesForSkill(skillId: string): ActivityDefinition[] {
  return activities.filter((a) => a.skillId === skillId)
}

export function blocksForSubject(subjectId: string): BlockDefinition[] {
  return blocks.filter((b) => b.subjectId === subjectId).sort((a, b) => a.sortOrder - b.sortOrder)
}

export function skillsForBlock(blockId: string): SkillDefinition[] {
  return skills.filter((s) => s.blockId === blockId).sort((a, b) => a.sortOrder - b.sortOrder)
}

export function defaultRoleForCourse(
  courseId: CourseId,
  activityId: string,
): CourseActivityAssignment['role'] | null {
  const row = courseActivityAssignments.find(
    (r) => r.courseId === courseId && r.activityId === activityId,
  )
  return row?.role ?? null
}

/** Snapshot serializable para API / panel adulto. */
export function catalogSnapshot() {
  return {
    courses,
    subjects,
    blocks,
    skills,
    activities,
    courseActivityAssignments,
    defaultCourseId: DEFAULT_COURSE_ID,
  }
}
