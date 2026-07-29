import { achievementImages } from '@/assets/achievements'
import { tableArtUrl } from '@/assets/tables'
import type { ProgressState } from '@/math/types'

export type AchievementCategory = 'insignias' | 'tablas'

export interface AchievementReward {
  coins?: number
  xp?: number
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
    reward: { coins: 10 },
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
    reward: { coins: 15 },
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
    reward: { coins: 30 },
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
    reward: { xp: 30 },
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
    reward: { coins: 50 },
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
    reward: { coins: 75, xp: 100 },
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
      reward: { coins: 15 },
      current: (progress) => (progress.tables[String(table)]?.everMastered ? 1 : 0),
      target: 1,
    }
  },
)

export const achievementCatalog = [...generalAchievements, ...tableAchievements]

export function achievementIsUnlocked(
  achievement: AchievementDefinition,
  progress: ProgressState,
): boolean {
  return achievement.current(progress) >= achievement.target
}

export function achievementRewardLabel(reward: AchievementReward): string {
  const parts: string[] = []
  if (reward.coins) parts.push(`${reward.coins} monedas`)
  if (reward.xp) parts.push(`${reward.xp} XP`)
  return parts.join(' + ')
}
