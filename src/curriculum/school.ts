import {
  activities,
  DEFAULT_COURSE_ID,
  defaultRoleForCourse,
  getActivity,
  getBlock,
  getCourse,
  getSkill,
  getSubject,
} from '@/curriculum/catalog'
import type {
  ActivityAssignmentMap,
  AssignmentRole,
  CourseId,
  CourseMode,
  LobbyMissionCard,
  SchoolProfile,
} from '@/curriculum/types'
import type { ProgressState } from '@/math/types'
import { tableStatus } from '@/math/tableMastery'

export function createDefaultSchoolProfile(
  now: Date = new Date(),
  courseId: CourseId = DEFAULT_COURSE_ID,
): SchoolProfile {
  return {
    currentCourseId: courseId,
    courseStartedAt: now.toISOString(),
    courseMode: courseId === 'primary-3' ? 'review' : 'standard',
    history: [],
  }
}

export function normalizeSchoolProfile(raw: unknown, now: Date = new Date()): SchoolProfile {
  const fallback = createDefaultSchoolProfile(now)
  if (!raw || typeof raw !== 'object') return fallback
  const parsed = raw as Partial<SchoolProfile>
  const courseId =
    parsed.currentCourseId === 'primary-3' ||
    parsed.currentCourseId === 'primary-4' ||
    parsed.currentCourseId === 'primary-5'
      ? parsed.currentCourseId
      : DEFAULT_COURSE_ID

  const history = Array.isArray(parsed.history)
    ? parsed.history.filter(
        (h): h is SchoolProfile['history'][number] =>
          !!h &&
          typeof h === 'object' &&
          (h.courseId === 'primary-3' || h.courseId === 'primary-4' || h.courseId === 'primary-5') &&
          typeof h.startedAt === 'string',
      )
    : []

  return {
    currentCourseId: courseId,
    courseStartedAt:
      typeof parsed.courseStartedAt === 'string' ? parsed.courseStartedAt : fallback.courseStartedAt,
    courseMode: parsed.courseMode === 'standard' || parsed.courseMode === 'review'
      ? parsed.courseMode
      : courseId === 'primary-3'
        ? 'review'
        : 'standard',
    history,
  }
}

export function normalizeActivityAssignments(raw: unknown): ActivityAssignmentMap {
  if (!raw || typeof raw !== 'object') return {}
  const out: ActivityAssignmentMap = {}
  for (const [id, role] of Object.entries(raw as Record<string, unknown>)) {
    if (
      role === 'recommended' ||
      role === 'mandatory' ||
      role === 'free' ||
      role === 'review' ||
      role === 'hidden'
    ) {
      out[id] = role
    }
  }
  return out
}

/**
 * Cambia de curso sin tocar XP, monedas, Robux, premios, logros,
 * tablas, resultados ni colección.
 */
export function changeCourse(
  profile: SchoolProfile,
  nextCourseId: CourseId,
  mode: CourseMode = 'standard',
  now: Date = new Date(),
): SchoolProfile {
  if (profile.currentCourseId === nextCourseId && profile.courseMode === mode) {
    return profile
  }
  const endedAt = now.toISOString()
  return {
    currentCourseId: nextCourseId,
    courseStartedAt: endedAt,
    courseMode: mode,
    history: [
      ...profile.history,
      {
        courseId: profile.currentCourseId,
        mode: profile.courseMode,
        startedAt: profile.courseStartedAt,
        endedAt,
      },
    ],
  }
}

export function effectiveActivityRole(
  activityId: string,
  courseId: CourseId,
  overrides: ActivityAssignmentMap,
): AssignmentRole | null {
  if (overrides[activityId]) return overrides[activityId]
  return defaultRoleForCourse(courseId, activityId)
}

export function isActivityVisibleToChild(
  activityId: string,
  courseId: CourseId,
  overrides: ActivityAssignmentMap,
): boolean {
  const activity = getActivity(activityId)
  if (!activity || activity.status !== 'active') return false
  const role = effectiveActivityRole(activityId, courseId, overrides)
  return role !== null && role !== 'hidden'
}

function activityPath(activityId: string): string {
  const activity = getActivity(activityId)
  const path = activity?.config.path
  return typeof path === 'string' ? path : '/missions/mates/tables'
}

function toLobbyCard(
  activityId: string,
  role: AssignmentRole,
  reason: LobbyMissionCard['reason'],
): LobbyMissionCard | null {
  const activity = getActivity(activityId)
  if (!activity) return null
  const skill = getSkill(activity.skillId)
  if (!skill) return null
  const block = getBlock(skill.blockId)
  const subject = block ? getSubject(block.subjectId) : undefined
  if (!block || !subject) return null
  const table = activity.config.table
  const playMode = activity.config.playMode
  return {
    activityId,
    title: activity.title,
    description: activity.description,
    subjectId: subject.id,
    blockId: block.id,
    skillId: skill.id,
    role,
    path: activityPath(activityId),
    reason,
    ...(typeof table === 'number' ? { table } : {}),
    ...(typeof playMode === 'string' ? { playMode } : {}),
  }
}

/** Misiones y listas que ve Aray en el Lobby (sin selector técnico de curso). */
export function buildLobbyMissions(
  progress: ProgressState,
  limit = 6,
): {
  recommended: LobbyMissionCard[]
  mandatory: LobbyMissionCard[]
  review: LobbyMissionCard[]
  free: LobbyMissionCard[]
} {
  const courseId = progress.school.currentCourseId
  const overrides = progress.activityAssignments
  const recommended: LobbyMissionCard[] = []
  const mandatory: LobbyMissionCard[] = []
  const review: LobbyMissionCard[] = []
  const free: LobbyMissionCard[] = []

  for (const activity of activities) {
    if (!isActivityVisibleToChild(activity.id, courseId, overrides)) continue
    const role = effectiveActivityRole(activity.id, courseId, overrides)
    if (!role || role === 'hidden') continue
    const card = toLobbyCard(activity.id, role, role === 'recommended' ? 'recommended' : role)
    if (!card) continue
    if (role === 'mandatory') mandatory.push(card)
    else if (role === 'review') review.push(card)
    else if (role === 'free') free.push(card)
    else recommended.push(card)
  }

  // Refuerzo por dominio: tablas que necesitan repaso suben a "review"
  for (const skill of activities
    .map((a) => getSkill(a.skillId))
    .filter((s): s is NonNullable<typeof s> => !!s && s.progressKind === 'multiplication-table')) {
    const tableKey = skill.progressKey
    if (!/^\d+$/.test(tableKey)) continue
    const table = progress.tables[tableKey]
    if (!table || !tableStatus(table).recommendPractice) continue
    const trainId = `mult-table-${tableKey}-train`
    if (!isActivityVisibleToChild(trainId, courseId, overrides)) continue
    if (review.some((c) => c.activityId === trainId)) continue
    if (mandatory.some((c) => c.activityId === trainId)) continue
    const role = effectiveActivityRole(trainId, courseId, overrides) ?? 'review'
    const card = toLobbyCard(trainId, role, 'review')
    if (card) review.push(card)
  }

  const sortByOrder = (a: LobbyMissionCard, b: LobbyMissionCard) => {
    const ao = getActivity(a.activityId)?.sortOrder ?? 0
    const bo = getActivity(b.activityId)?.sortOrder ?? 0
    return ao - bo
  }

  return {
    recommended: recommended.sort(sortByOrder).slice(0, limit),
    mandatory: mandatory.sort(sortByOrder).slice(0, limit),
    review: review.sort(sortByOrder).slice(0, limit),
    free: free.sort(sortByOrder).slice(0, limit),
  }
}

export function courseLabel(courseId: CourseId): string {
  return getCourse(courseId)?.title ?? courseId
}

export function visibleWorlds(progress: ProgressState) {
  const courseId = progress.school.currentCourseId
  const overrides = progress.activityAssignments
  return ['maths', 'languages', 'english']
    .map((id) => getSubject(id)!)
    .map((subject) => {
      const hasPlayable = activities.some((a) => {
        const skill = getSkill(a.skillId)
        const block = skill ? getBlock(skill.blockId) : undefined
        return (
          block?.subjectId === subject.id &&
          isActivityVisibleToChild(a.id, courseId, overrides)
        )
      })
      return { ...subject, hasPlayable }
    })
}
