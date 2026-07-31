export type DailySkillKey = 'tables' | 'calc' | 'spelling' | 'clocks' | 'money'

export interface DailyTaskDef {
  key: DailySkillKey
  label: string
  target: number
  href: string
}

export const DAILY_TASKS: DailyTaskDef[] = [
  { key: 'tables', label: 'Tablas', target: 6, href: '/missions/mates/tables' },
  { key: 'calc', label: 'Cálculo', target: 5, href: '/missions/mates/calc/mix' },
  { key: 'spelling', label: 'Ortografía', target: 4, href: '/missions/languages/spelling/mix' },
  { key: 'clocks', label: 'Relojes', target: 2, href: '/missions/mates/clocks/train' },
  { key: 'money', label: 'Dinero', target: 1, href: '/missions/mates/money/change' },
]
