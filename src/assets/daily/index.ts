import tablesIcon from '@/assets/daily/tables.png'
import calcIcon from '@/assets/daily/calc.png'
import spellingIcon from '@/assets/daily/spelling.png'
import clocksIcon from '@/assets/daily/clocks.png'
import moneyIcon from '@/assets/daily/money.png'
import type { DailySkillKey } from '@/daily/DailyMissionContext'

export const dailySkillIcons: Record<DailySkillKey, string> = {
  tables: tablesIcon,
  calc: calcIcon,
  spelling: spellingIcon,
  clocks: clocksIcon,
  money: moneyIcon,
}
