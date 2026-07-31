import { achievementImages } from '@/assets/achievements'
import { modeArtUrl } from '@/assets/modes'
import { tableArtUrl } from '@/assets/tables'
import { normalizeAlphabetModeProgress } from '@/alphabet/progress'
import type { ProgressState } from '@/math/types'

export type AchievementCategory = 'insignias' | 'tablas' | 'lenguas'

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
    shortDescription: 'Todas las tablas están domadas. Colección épica.',
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
]

export const achievementCatalog = [
  ...generalAchievements,
  ...tableAchievements,
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
