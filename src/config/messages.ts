export const praiseMessages = [
  '¡Buenísima!',
  '¡Genial!',
  '¡Exacto!',
  '¡Qué crack!',
  '¡Así se hace!',
] as const

export const streakMessages: Record<number, string> = {
  3: '¡Racha de 3!',
  5: '¡Racha de 5!',
  8: '¡Racha de 8!',
  10: '¡Racha de 10!',
}

export function wrongHelpMessage(a: number, b: number, product: number): string {
  return `Casi: ${a} × ${b} son ${product}`
}

export const retryHint = 'Esta volverá a salir para que la domines.'

export const newRecordMessage = '¡Nuevo récord!'

export const noMissesMessage =
  'Hoy no hay fallos pendientes. ¡Practica una mezcla y sigue afilando!'
