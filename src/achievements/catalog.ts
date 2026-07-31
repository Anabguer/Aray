import { achievementImages } from '@/assets/achievements'
import { dailySkillIcons } from '@/assets/daily'
import { modeArtUrl } from '@/assets/modes'
import { tableArtUrl } from '@/assets/tables'
import { normalizeAlphabetModeProgress } from '@/alphabet/progress'
import { createEmptyStats } from '@/achievements/stats'
import type { ProgressState } from '@/math/types'

export type AchievementCategory = 'insignias' | 'tablas' | 'mates' | 'lenguas'

export interface AchievementReward {
  energy: number
}

export interface AchievementDefinition {
  id: string
  title: string
  shortDescription: string
  howToUnlock: string
  category: AchievementCategory
  image: string
  reward: AchievementReward
  current: (progress: ProgressState) => number
  target: number
}

function statsOf(progress: ProgressState) {
  return progress.stats ?? createEmptyStats()
}

const generalAchievements: AchievementDefinition[] = [
  {
    id: 'primera-mision',
    title: 'Despegue completado',
    shortDescription: 'Tu primera misión ya forma parte de la historia.',
    howToUnlock: 'Completa cualquier actividad jugable.',
    category: 'insignias',
    image: achievementImages.primeraMision,
    reward: { energy: 10 },
    current: (progress) => (progress.lastPracticeAt ? 1 : 0),
    target: 1,
  },
  {
    id: 'racha-5',
    title: 'Chispa imparable',
    shortDescription: 'Cinco aciertos seguidos. Aquí empieza el combo.',
    howToUnlock: 'Consigue una racha de 5 respuestas correctas.',
    category: 'insignias',
    image: achievementImages.racha5,
    reward: { energy: 15 },
    current: (progress) => progress.bestStreak,
    target: 5,
  },
  {
    id: 'racha-10',
    title: 'Modo leyenda',
    shortDescription: 'Diez seguidas sin pestañear. Bueno, pestañear sí.',
    howToUnlock: 'Consigue una racha de 10 respuestas correctas.',
    category: 'insignias',
    image: achievementImages.racha10,
    reward: { energy: 25 },
    current: (progress) => progress.bestStreak,
    target: 10,
  },
  {
    id: 'reto-5',
    title: 'Reto encendido',
    shortDescription: 'El cronómetro ya sabe quién manda.',
    howToUnlock: 'Acierta 5 operaciones en un Reto rápido.',
    category: 'insignias',
    image: achievementImages.retoRapido,
    reward: { energy: 15 },
    current: (progress) => progress.bestChallengeScore,
    target: 5,
  },
  {
    id: 'reto-perfecto',
    title: 'Diana perfecta',
    shortDescription: 'Diez de diez. Ni una operación logró escaparse.',
    howToUnlock: 'Consigue 10 aciertos en un Reto rápido.',
    category: 'insignias',
    image: achievementImages.retoPerfecto,
    reward: { energy: 30 },
    current: (progress) => progress.bestChallengeScore,
    target: 10,
  },
  {
    id: 'todas-domadas',
    title: 'Domador supremo',
    shortDescription: 'Todas las tablas están domadas. Logro épico.',
    howToUnlock: 'Doma las tablas del 2 al 9.',
    category: 'insignias',
    image: achievementImages.todasDomadas,
    reward: { energy: 40 },
    current: (progress) =>
      Array.from({ length: 8 }, (_, index) => index + 2).filter(
        (table) => progress.tables[String(table)]?.everMastered,
      ).length,
    target: 8,
  },
  {
    id: 'play-10min',
    title: 'Calentando motores',
    shortDescription: 'Diez minutos de farmeo. Empieza la sesión.',
    howToUnlock: 'Acumula 10 minutos jugando.',
    category: 'insignias',
    image: achievementImages.racha5,
    reward: { energy: 15 },
    current: (progress) => Math.floor(statsOf(progress).playSeconds / 60),
    target: 10,
  },
  {
    id: 'play-30min',
    title: 'Sesión seria',
    shortDescription: 'Media hora de práctica. Nivel pro.',
    howToUnlock: 'Acumula 30 minutos jugando.',
    category: 'insignias',
    image: achievementImages.racha10,
    reward: { energy: 25 },
    current: (progress) => Math.floor(statsOf(progress).playSeconds / 60),
    target: 30,
  },
  {
    id: 'play-60min',
    title: 'Maratón AFK',
    shortDescription: 'Una hora total. El lobby te echa de menos… casi.',
    howToUnlock: 'Acumula 60 minutos jugando.',
    category: 'insignias',
    image: achievementImages.retoPerfecto,
    reward: { energy: 40 },
    current: (progress) => Math.floor(statsOf(progress).playSeconds / 60),
    target: 60,
  },
  {
    id: 'sessions-10',
    title: 'Diez partidas',
    shortDescription: 'Diez actividades completadas. Ritmo constante.',
    howToUnlock: 'Completa 10 actividades (cualquier mundo).',
    category: 'insignias',
    image: achievementImages.primeraMision,
    reward: { energy: 15 },
    current: (progress) => statsOf(progress).sessionsCompleted,
    target: 10,
  },
  {
    id: 'sessions-25',
    title: 'Veinticinco partidas',
    shortDescription: 'Ya conoces el mapa. Sigue farmeando.',
    howToUnlock: 'Completa 25 actividades.',
    category: 'insignias',
    image: achievementImages.retoRapido,
    reward: { energy: 25 },
    current: (progress) => statsOf(progress).sessionsCompleted,
    target: 25,
  },
  {
    id: 'good-streak-3',
    title: 'Racha de tres',
    shortDescription: 'Tres partidas seguidas con buen resultado (≥80%).',
    howToUnlock: 'Completa 3 actividades seguidas con al menos 80% de aciertos.',
    category: 'insignias',
    image: achievementImages.racha5,
    reward: { energy: 20 },
    current: (progress) => statsOf(progress).bestGoodSessionStreak,
    target: 3,
  },
  {
    id: 'good-streak-5',
    title: 'Racha de cinco',
    shortDescription: 'Cinco partidas buenas seguidas. Combo de verdad.',
    howToUnlock: 'Completa 5 actividades seguidas con al menos 80% de aciertos.',
    category: 'insignias',
    image: achievementImages.racha10,
    reward: { energy: 30 },
    current: (progress) => statsOf(progress).bestGoodSessionStreak,
    target: 5,
  },
  {
    id: 'daily-primera',
    title: 'Misión diaria hecha',
    shortDescription: 'Completaste la misión diaria. Bonus merecido.',
    howToUnlock: 'Completa la misión diaria una vez.',
    category: 'insignias',
    image: dailySkillIcons.tables,
    reward: { energy: 15 },
    current: (progress) => Math.min(1, statsOf(progress).dailyMissionsCompleted),
    target: 1,
  },
  {
    id: 'daily-5',
    title: 'Cinco días de misión',
    shortDescription: 'Cinco misiones diarias completadas. Constancia.',
    howToUnlock: 'Completa la misión diaria 5 veces.',
    category: 'insignias',
    image: dailySkillIcons.calc,
    reward: { energy: 35 },
    current: (progress) => statsOf(progress).dailyMissionsCompleted,
    target: 5,
  },
]

const tableAchievements: AchievementDefinition[] = Array.from(
  { length: 8 },
  (_, index): AchievementDefinition => {
    const table = index + 2
    return {
      id: `tabla-${table}-domada`,
      title: `Tabla del ${table} domada`,
      shortDescription: `La tabla del ${table} ya tiene dueño.`,
      howToUnlock: `Consigue al menos 8/10 en una ronda evaluable de la tabla del ${table}.`,
      category: 'tablas',
      image: tableArtUrl(table)!,
      reward: { energy: 15 },
      current: (progress) => (progress.tables[String(table)]?.everMastered ? 1 : 0),
      target: 1,
    }
  },
)

const ABC_MODE_DEFS: Array<{
  id: string
  mode: 'missing' | 'neighbor' | 'order-letters' | 'order-words'
  title: string
  art: 'abc-falta' | 'abc-vecina' | 'abc-letras' | 'abc-palabras'
}> = [
  {
    id: 'abc-falta-domado',
    mode: 'missing',
    title: 'Letra que falta domada',
    art: 'abc-falta',
  },
  {
    id: 'abc-vecina-domado',
    mode: 'neighbor',
    title: 'Siguiente/anterior domado',
    art: 'abc-vecina',
  },
  {
    id: 'abc-letras-domado',
    mode: 'order-letters',
    title: 'Ordena letras domado',
    art: 'abc-letras',
  },
  {
    id: 'abc-palabras-domado',
    mode: 'order-words',
    title: 'Ordena palabras domado',
    art: 'abc-palabras',
  },
]

const languageAchievements: AchievementDefinition[] = [
  {
    id: 'abc-primera',
    title: 'Letras en marcha',
    shortDescription: 'Tu primera ronda del ABC ya cuenta.',
    howToUnlock: 'Completa una ronda del ABC.',
    category: 'lenguas',
    image: modeArtUrl('abc-random'),
    reward: { energy: 10 },
    current: (progress) => (progress.alphabet.roundsPlayed > 0 ? 1 : 0),
    target: 1,
  },
  {
    id: 'abc-crack',
    title: 'Crack del ABC',
    shortDescription: 'Una ronda perfecta. Ni una letra se te escapó.',
    howToUnlock: 'Acaba una ronda del ABC sin fallos.',
    category: 'lenguas',
    image: modeArtUrl('abc-falta'),
    reward: { energy: 25 },
    current: (progress) => Math.min(1, progress.alphabet.perfectRounds),
    target: 1,
  },
  ...ABC_MODE_DEFS.map(
    (def): AchievementDefinition => ({
      id: def.id,
      title: def.title,
      shortDescription: `${def.title.replace(' domado', '')} ya está bajo control.`,
      howToUnlock: `Consigue al menos 8/10 en ${def.title.replace(' domado', '').toLowerCase()}.`,
      category: 'lenguas',
      image: modeArtUrl(def.art),
      reward: { energy: 15 },
      current: (progress) =>
        normalizeAlphabetModeProgress(progress.alphabet.modes[def.mode]).everMastered ? 1 : 0,
      target: 1,
    }),
  ),
  {
    id: 'abc-todos-domados',
    title: 'ABC completo',
    shortDescription: 'Los cuatro modos del abecedario, domados.',
    howToUnlock: 'Doma letra que falta, vecina, ordena letras y ordena palabras.',
    category: 'lenguas',
    image: modeArtUrl('abc-random'),
    reward: { energy: 40 },
    current: (progress) =>
      ABC_MODE_DEFS.filter((d) =>
        normalizeAlphabetModeProgress(progress.alphabet.modes[d.mode]).everMastered,
      ).length,
    target: 4,
  },
  {
    id: 'spell-primera',
    title: 'Ortografía on',
    shortDescription: 'Primera ronda de ortografía completada.',
    howToUnlock: 'Completa una actividad de ortografía.',
    category: 'lenguas',
    image: dailySkillIcons.spelling,
    reward: { energy: 10 },
    current: (progress) => Math.min(1, statsOf(progress).byFeature.spelling.sessions),
    target: 1,
  },
  {
    id: 'spell-perfecto',
    title: 'Sin faltas',
    shortDescription: 'Una ronda de ortografía perfecta.',
    howToUnlock: 'Acaba una ronda de ortografía sin fallos.',
    category: 'lenguas',
    image: modeArtUrl('spell-correct'),
    reward: { energy: 25 },
    current: (progress) => Math.min(1, statsOf(progress).byFeature.spelling.perfect),
    target: 1,
  },
  {
    id: 'spell-3-modos',
    title: 'Explorador de reglas',
    shortDescription: 'Has tocado tres modos distintos de ortografía.',
    howToUnlock: 'Juega 3 modos diferentes de ortografía.',
    category: 'lenguas',
    image: modeArtUrl('spell-mix'),
    reward: { energy: 20 },
    current: (progress) => statsOf(progress).byFeature.spelling.modes.length,
    target: 3,
  },
]

const matesAchievements: AchievementDefinition[] = [
  {
    id: 'calc-primera',
    title: 'Cálculo on',
    shortDescription: 'Primera partida de cálculo.',
    howToUnlock: 'Completa una actividad de cálculo.',
    category: 'mates',
    image: dailySkillIcons.calc,
    reward: { energy: 10 },
    current: (progress) => Math.min(1, statsOf(progress).byFeature.calc.sessions),
    target: 1,
  },
  {
    id: 'calc-mix',
    title: 'Mezcla mental',
    shortDescription: 'Has jugado el modo mezcla de cálculo.',
    howToUnlock: 'Completa una ronda de cálculo en modo mezcla.',
    category: 'mates',
    image: modeArtUrl('calc-mix'),
    reward: { energy: 15 },
    current: (progress) =>
      statsOf(progress).byFeature.calc.modes.includes('mix') ? 1 : 0,
    target: 1,
  },
  {
    id: 'calc-3-modos',
    title: 'Calculadora humana',
    shortDescription: 'Tres modos de cálculo distintos.',
    howToUnlock: 'Juega 3 modos diferentes de cálculo.',
    category: 'mates',
    image: modeArtUrl('calc-add'),
    reward: { energy: 20 },
    current: (progress) => statsOf(progress).byFeature.calc.modes.length,
    target: 3,
  },
  {
    id: 'clocks-primera',
    title: 'Hora punta',
    shortDescription: 'Primera partida de relojes.',
    howToUnlock: 'Completa una actividad de relojes.',
    category: 'mates',
    image: dailySkillIcons.clocks,
    reward: { energy: 10 },
    current: (progress) => Math.min(1, statsOf(progress).byFeature.clocks.sessions),
    target: 1,
  },
  {
    id: 'clocks-3',
    title: 'Relojero en prácticas',
    shortDescription: 'Tres partidas de relojes.',
    howToUnlock: 'Completa 3 actividades de relojes.',
    category: 'mates',
    image: dailySkillIcons.clocks,
    reward: { energy: 20 },
    current: (progress) => statsOf(progress).byFeature.clocks.sessions,
    target: 3,
  },
  {
    id: 'money-primera',
    title: 'Monedero listo',
    shortDescription: 'Primera partida de dinero.',
    howToUnlock: 'Completa una actividad de dinero.',
    category: 'mates',
    image: dailySkillIcons.money,
    reward: { energy: 10 },
    current: (progress) => Math.min(1, statsOf(progress).byFeature.money.sessions),
    target: 1,
  },
  {
    id: 'money-mix',
    title: 'Cajero experto',
    shortDescription: 'Has jugado el modo mezcla de dinero.',
    howToUnlock: 'Completa una ronda de dinero en modo mezcla.',
    category: 'mates',
    image: dailySkillIcons.money,
    reward: { energy: 15 },
    current: (progress) =>
      statsOf(progress).byFeature.money.modes.includes('mix') ? 1 : 0,
    target: 1,
  },
]

export const achievementCatalog = [
  ...generalAchievements,
  ...tableAchievements,
  ...matesAchievements,
  ...languageAchievements,
]

export function achievementIsUnlocked(
  achievement: AchievementDefinition,
  progress: ProgressState,
): boolean {
  return achievement.current(progress) >= achievement.target
}

export function achievementRewardLabel(reward: AchievementReward): string {
  return `+${reward.energy} energía`
}

/** Logros desbloqueados y aún no reclamados (badge lobby). */
export function countClaimableAchievements(progress: ProgressState): number {
  const claimed = new Set(progress.achievements.claimedIds)
  return achievementCatalog.filter(
    (a) => achievementIsUnlocked(a, progress) && !claimed.has(a.id),
  ).length
}
