export type ZoneId = 'missions' | 'collection' | 'reading' | 'gallery'

export type SubjectId = 'mates' | 'catala' | 'castellano' | 'angles' | 'medi'

export type ZoneStatus = 'active' | 'coming-soon'

export interface DemoProfile {
  displayName: string
  greeting: string
  xp: number
  xpGoal: number
  coins: number
}

export interface DemoMissionOfDay {
  title: string
  subjectId: SubjectId
  subjectLabel: string
  hint: string
}

export interface ZoneLink {
  id: ZoneId
  title: string
  description: string
  status: ZoneStatus
  path: string
}

export interface SubjectPreview {
  id: SubjectId
  title: string
  shortLabel: string
  description: string
  accent: 'mates' | 'catala' | 'castellano' | 'angles' | 'medi'
}
