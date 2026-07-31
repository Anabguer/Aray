import tablesIcon from '@/assets/daily/tables.webp'
import calcIcon from '@/assets/daily/calc.webp'
import spellingIcon from '@/assets/daily/spelling.webp'
import clocksIcon from '@/assets/daily/clocks.webp'
import moneyIcon from '@/assets/daily/money.webp'
import type { DailySkillKey } from '@/daily/DailyMissionContext'

export const dailySkillIcons: Record<DailySkillKey, string> = {
  tables: tablesIcon,
  calc: calcIcon,
  spelling: spellingIcon,
  clocks: clocksIcon,
  money: moneyIcon,
}
