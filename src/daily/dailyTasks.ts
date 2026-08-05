export type DailySkillKey =
  | 'tables'
  | 'calc'
  | 'spelling'
  | 'words'
  | 'clocks'
  | 'money'

export interface DailyTaskDef {
  key: DailySkillKey
  label: string
  target: number
  href: string
}

/**
 * Cupos de misión diaria.
 * Unidades: 6+5+2+2+2+1 = 18 × 5 energía + 10 reto = 100.
 * Lengua repartida: Ortografía 2 + Palabras 2.
 */
export const DAILY_TASKS: DailyTaskDef[] = [
  { key: 'tables', label: 'Tablas', target: 6, href: '/missions/mates/tables' },
  { key: 'calc', label: 'Cálculo', target: 5, href: '/missions/mates/calc/mix' },
  {
    key: 'spelling',
    label: 'Ortografía',
    target: 2,
    href: '/missions/languages/spelling/mix',
  },
  {
    key: 'words',
    label: 'Palabras',
    target: 2,
    href: '/missions/languages/words',
  },
  { key: 'clocks', label: 'Relojes', target: 2, href: '/missions/mates/clocks' },
  { key: 'money', label: 'Dinero', target: 1, href: '/missions/mates/money/mix' },
]
