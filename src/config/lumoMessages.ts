import type { LumoState } from '@/lumo/types'

export const lumoMessages = {
  glow: '¡Lumo está brillando!',
  streakCharge: 'Tu racha ha cargado la energía de Lumo.',
  maxed: '¡Lumo está a tope!',
  practiceMisses: 'Lumo te ayudará a practicar tus fallos.',
  dailyComplete: '¡Barra del día llena!',
  goalComplete: '¡Drop desbloqueado! Pendiente de validar por un adulto',
  oops: 'Casi. Piénsalo otra vez.',
  tryAgain: 'Casi. Piénsalo otra vez.',
} as const


export function lumoMessageForState(state: LumoState, streak: number): string | null {
  switch (state) {
    case 'correct':
      return streak >= 5 ? lumoMessages.streakCharge : lumoMessages.glow
    case 'streak':
      return streak >= 10 ? lumoMessages.maxed : lumoMessages.streakCharge
    case 'incorrect':
      return lumoMessages.oops
    case 'celebration':
      return lumoMessages.maxed
    default:
      return null
  }
}
