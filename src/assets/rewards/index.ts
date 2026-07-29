import cajaEpica from './caja-epica.png'
import cajaEspecial from './caja-especial.png'
import cajaNormal from './caja-normal.png'

export type CrateRarity = 'normal' | 'especial' | 'epica'

/** Arte de caja por rareza (PNG con transparencia → object-fit: contain). */
export const crateArt: Record<CrateRarity, string> = {
  normal: cajaNormal,
  especial: cajaEspecial,
  epica: cajaEpica,
}
