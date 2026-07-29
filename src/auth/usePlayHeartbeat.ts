/** Heartbeat opcional: en el acceso libre infantil no hay sesión child. */
export function usePlayHeartbeat(): void {
  // Sin sesión infantil: no-op. Se mantiene el archivo por si se reactiva sync más adelante.
}
