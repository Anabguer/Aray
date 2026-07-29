import tabla2 from './tabla-2.png'
import tabla3 from './tabla-3.png'
import tabla4 from './tabla-4.png'
import tabla5 from './tabla-5.png'
import tabla6 from './tabla-6.png'
import tabla7 from './tabla-7.png'
import tabla8 from './tabla-8.png'
import tabla9 from './tabla-9.png'
import type { PlayableTable } from '@/config/playConfig'

/** Arte de nivel por tabla (cuadrado con fondo → object-fit: cover). */
export const tableArt: Record<PlayableTable, string> = {
  2: tabla2,
  3: tabla3,
  4: tabla4,
  5: tabla5,
  6: tabla6,
  7: tabla7,
  8: tabla8,
  9: tabla9,
}

export function tableArtUrl(table: number): string | undefined {
  if (table >= 2 && table <= 9) return tableArt[table as PlayableTable]
  return undefined
}
