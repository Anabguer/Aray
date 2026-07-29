export type AdultPlayer = {
  id: number
  slug: string
  displayName: string
}

export type AdultSummary = {
  daysPlayed: number
  lastActivityAt: string | null
  lastActivityDate: string | null
  playSecondsTotal: number
  sessionsCount: number
  activitiesCount: number
  correctCount: number
  wrongCount: number
  accuracyPct: number | null
  rewardPointsCurrent: number
  rewardTarget: number
  currentCycleNumber: number
  xp: number
  level: number
  coins: number
  energyToday: number
  energyCap: number
  currentStreak: number
  bestStreak: number
  dominatedTables: number[]
  pendingPrizesCount: number
  deliveredPrizesCount: number
}

export type MasteryLabel = 'DOMADA' | 'CASI DOMADA' | 'ENTRENANDO' | 'NECESITA REFUERZO'

export type TableMasteryItem = {
  tableN: number
  label: MasteryLabel | string
  practiced: boolean
  attempts: number
  correct: number
  masteryScore: number
  bestRoundScore: number
  lastRoundScore: number | null
  everMastered: boolean
  lastPracticedAt: string | null
  accuracyPct: number | null
}

export type RewardCycle = {
  id: number
  cycleNumber: number
  targetPoints: number
  pointsToward: number
  status: string
  earnedAt: string | null
  deliveredAt: string | null
  robuxAmount: number | null
  deliveryNote: string | null
  deliveryDateLocal: string | null
  voidedAt?: string | null
  voidReason?: string | null
}

export type AdultDevice = {
  id: number
  deviceLabel: string
  tokenPrefix: string
  userAgent: string | null
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
  revokedAt: string | null
  active: boolean
}

export type ActivityDay = {
  activityDate: string
  playSeconds: number
  sessionsCount: number
  activitiesCount: number
  correctCount: number
  wrongCount: number
  accuracyPct: number | null
  xpEarned: number
  coinsEarned: number
  rewardPointsEarned: number
  tables: Record<string, number> | object
  modes: Record<string, number> | object
  lastSeenAt: string | null
}

export type AdultOverview = {
  player: AdultPlayer
  school?: {
    currentCourseId: string
    courseMode: string
    courseStartedAt: string
    history: Array<{
      courseId: string
      mode: string
      startedAt: string
      endedAt: string | null
    }>
    activityAssignments: Record<string, string>
  }
  summary: AdultSummary
  education: {
    dominated: TableMasteryItem[]
    learning: TableMasteryItem[]
    needsReview: TableMasteryItem[]
    tables: TableMasteryItem[]
    hardFacts: Array<{
      factKey: string
      attempts: number
      correct: number
      wrong: number
      accuracyPct: number | null
    }>
  }
  educationReport?: {
    scope: string
    filters: {
      courseId: string | null
      subjectId: string | null
      blockId: string | null
      skillId: string | null
    }
    skills: Array<{
      skillId: string
      skillTitle: string
      blockId: string
      blockTitle: string
      subjectId: string
      subjectTitle: string
      progressKey: string
      progressKind: string
      mastery: {
        attempts: number
        correct: number
        masteryScore: number
        everMastered: boolean
        label: string
        lastPracticedAt: string | null
      } | null
    }>
  }
  pendingPrizes: RewardCycle[]
  deliveredPrizes: RewardCycle[]
  devices: AdultDevice[]
  playableDate: string
}
