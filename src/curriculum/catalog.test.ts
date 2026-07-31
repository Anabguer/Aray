import { describe, expect, it } from 'vitest'
import {
  activities,
  blocks,
  buildLobbyMissions,
  catalogSnapshot,
  changeCourse,
  courseActivityAssignments,
  createDefaultSchoolProfile,
  DEFAULT_COURSE_ID,
  effectiveActivityRole,
  getActivity,
  getSkill,
  isActivityVisibleToChild,
  skills,
  subjects,
} from '@/curriculum'
import { createInitialProgress, normalizeProgress } from '@/progress/repository'

describe('catálogo curricular', () => {
  it('tiene cursos 3.º y 4.º y deja 5.º como futuro', () => {
    const snap = catalogSnapshot()
    expect(snap.defaultCourseId).toBe('primary-3')
    expect(snap.courses.map((c) => c.id)).toEqual(['primary-3', 'primary-4', 'primary-5'])
    expect(snap.courses.find((c) => c.id === 'primary-5')?.status).toBe('future')
  })

  it('clasifica bloques de 3.º sin inventar actividades falsas', () => {
    expect(subjects.map((s) => s.id)).toEqual(['maths', 'languages', 'english'])
    const mathsBlocks = blocks.filter((b) => b.subjectId === 'maths').map((b) => b.id)
    expect(mathsBlocks).toEqual([
      'multiplication-tables',
      'calculation',
      'problems',
      'clocks-hours',
    ])
    expect(blocks.find((b) => b.id === 'clocks-hours')?.status).toBe('active')
    expect(blocks.find((b) => b.id === 'calculation')?.status).toBe('active')
    expect(blocks.find((b) => b.id === 'alphabet')?.status).toBe('active')
    const futureBlocks = blocks.filter((b) => b.status === 'future')
    expect(futureBlocks.length).toBeGreaterThan(3)
    expect(
      activities.every(
        (a) =>
          a.id.includes('mult-') ||
          a.id.startsWith('clock-') ||
          a.id.startsWith('alphabet-') ||
          a.id.startsWith('calc-'),
      ),
    ).toBe(true)
  })

  it('no incluye el curso en los IDs de actividad', () => {
    for (const activity of activities) {
      expect(activity.id).not.toMatch(/primary|3º|4º|curso/i)
      expect(getSkill(activity.skillId)).toBeTruthy()
    }
  })

  it('asigna la misma actividad a 3.º y 4.º sin duplicar progreso', () => {
    const train2 = getActivity('mult-table-2-train')
    expect(train2?.skillId).toBe('mult-table-2')
    const in3 = courseActivityAssignments.find(
      (r) => r.courseId === 'primary-3' && r.activityId === 'mult-table-2-train',
    )
    const in4 = courseActivityAssignments.find(
      (r) => r.courseId === 'primary-4' && r.activityId === 'mult-table-2-train',
    )
    expect(in3?.role).toBe('recommended')
    expect(in4?.role).toBe('review')
    expect(getSkill('mult-table-2')?.progressKey).toBe('2')
  })

  it('todas las modalidades de una tabla comparten la misma habilidad', () => {
    const modes = activities.filter((a) => a.skillId === 'mult-table-7')
    expect(modes.map((m) => m.exerciseType).sort()).toEqual([
      'complete',
      'learn',
      'match',
      'timed',
    ])
    expect(new Set(modes.map((m) => m.skillId)).size).toBe(1)
  })
  it('incluye actividades de horas en el bloque clocks-hours', () => {
    expect(getSkill('clock-hours')?.blockId).toBe('clocks-hours')
    expect(getSkill('clock-hours')?.progressKind).toBe('generic')
    const clockActs = activities.filter((a) => a.skillId === 'clock-hours')
    expect(clockActs.map((a) => a.exerciseType).sort()).toEqual([
      'learn',
      'match',
      'multiple-choice',
    ])
  })

  it('incluye actividades de abecedario en Lenguas', () => {
    expect(getSkill('alphabet-letters')?.blockId).toBe('alphabet')
    const alphaActs = activities.filter((a) => a.skillId === 'alphabet-letters')
    expect(alphaActs.map((a) => a.id).sort()).toEqual([
      'alphabet-missing',
      'alphabet-neighbor',
      'alphabet-order-letters',
      'alphabet-order-words',
      'alphabet-random',
    ])
  })
})

describe('perfil escolar y visibilidad', () => {
  it('Aray empieza en 3.º de Primaria en modo repaso', () => {
    const profile = createDefaultSchoolProfile()
    expect(profile.currentCourseId).toBe(DEFAULT_COURSE_ID)
    expect(profile.courseMode).toBe('review')
    const progress = createInitialProgress()
    expect(progress.school.currentCourseId).toBe('primary-3')
    expect(progress.version).toBe(4)
  })

  it('cambiar a 4.º no borra XP, monedas, tablas ni Robux', () => {
    const base = createInitialProgress()
    base.xp = 250
    base.coins = 40
    base.reward.pointsTotal = 120
    base.tables['2'] = {
      practiced: true,
      attempts: 20,
      correct: 18,
      masteryScore: 80,
      lastPracticedAt: '2026-01-01T00:00:00.000Z',
      bestRoundScore: 9,
      lastRoundScore: 9,
      consecutiveLowRounds: 0,
      everMastered: true,
    }
    base.achievements.claimedIds = ['first-win']
    const nextSchool = changeCourse(base.school, 'primary-4', 'standard')
    const next = { ...base, school: nextSchool }
    expect(next.xp).toBe(250)
    expect(next.coins).toBe(40)
    expect(next.reward.pointsTotal).toBe(120)
    expect(next.tables['2']?.everMastered).toBe(true)
    expect(next.achievements.claimedIds).toEqual(['first-win'])
    expect(next.school.currentCourseId).toBe('primary-4')
    expect(next.school.history).toHaveLength(1)
    expect(next.school.history[0]?.courseId).toBe('primary-3')
  })

  it('el adulto puede ocultar una actividad y Aray deja de verla', () => {
    const overrides = { 'mult-table-2-train': 'hidden' as const }
    expect(isActivityVisibleToChild('mult-table-2-train', 'primary-3', {})).toBe(true)
    expect(isActivityVisibleToChild('mult-table-2-train', 'primary-3', overrides)).toBe(false)
    expect(effectiveActivityRole('mult-table-2-train', 'primary-4', {})).toBe('review')
    expect(effectiveActivityRole('mult-table-2-train', 'primary-4', { 'mult-table-2-train': 'mandatory' })).toBe(
      'mandatory',
    )
  })

  it('el lobby propaga tabla y modo de la actividad (no solo el path genérico)', () => {
    const progress = createInitialProgress()
    const lobby = buildLobbyMissions(progress, 8)
    const learn2 = lobby.recommended.find((m) => m.activityId === 'mult-table-2-learn')
    expect(learn2).toBeTruthy()
    expect(learn2?.title).toContain('tabla del 2')
    expect(learn2?.table).toBe(2)
    expect(learn2?.playMode).toBe('learn')
    expect(learn2?.path).toBe('/missions/mates/tables/learn')
  })

  it('migra progreso antiguo a v4 conservando dominio', () => {
    const migrated = normalizeProgress({
      version: 3,
      xp: 99,
      coins: 12,
      tables: {
        '2': {
          practiced: true,
          attempts: 5,
          correct: 4,
          masteryScore: 50,
          everMastered: true,
          bestRoundScore: 8,
          lastRoundScore: 8,
          consecutiveLowRounds: 0,
        },
      },
    })
    expect(migrated.version).toBe(4)
    expect(migrated.xp).toBe(99)
    expect(migrated.tables['2']?.everMastered).toBe(true)
    expect(migrated.school.currentCourseId).toBe('primary-3')
    expect(skills.length).toBeGreaterThan(8)
  })
})
