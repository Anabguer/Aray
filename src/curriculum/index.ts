export type {
  ActivityAssignmentMap,
  ActivityDefinition,
  AssignmentRole,
  BlockDefinition,
  BlockId,
  CatalogStatus,
  CourseDefinition,
  CourseId,
  CourseMode,
  Difficulty,
  ExerciseType,
  LobbyMissionCard,
  SchoolProfile,
  SkillDefinition,
  SubjectDefinition,
  SubjectId,
} from '@/curriculum/types'

export {
  activities,
  blocks,
  blocksForSubject,
  catalogSnapshot,
  courseActivityAssignments,
  courses,
  DEFAULT_COURSE_ID,
  defaultRoleForCourse,
  getActivity,
  getBlock,
  getCourse,
  getSkill,
  getSubject,
  skills,
  skillsForBlock,
  subjects,
} from '@/curriculum/catalog'

export {
  buildLobbyMissions,
  changeCourse,
  courseLabel,
  createDefaultSchoolProfile,
  effectiveActivityRole,
  isActivityVisibleToChild,
  normalizeActivityAssignments,
  normalizeSchoolProfile,
  visibleWorlds,
} from '@/curriculum/school'

export {
  hubGuideTip,
  hubHasWeakZones,
  resolveHubZoneStatus,
  zoneNeedsRecommendation,
} from '@/curriculum/hubRecommendations'
export type { HubZoneId } from '@/curriculum/hubRecommendations'

export {
  pickDailyChallenge,
  type DailyChallengeCard,
} from '@/curriculum/dailyChallenge'
