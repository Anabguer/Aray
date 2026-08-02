/** Lógica pura de Formar palabras (ayuda + letras fijas en verde). */

export type Slot = string | null

export function emptySlots(n: number): Slot[] {
  return Array.from({ length: n }, () => null)
}

/** Multiconjunto de letras (soporta tildes / ñ / ü). */
export function letterCounts(letters: string[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const ch of letters) {
    map.set(ch, (map.get(ch) ?? 0) + 1)
  }
  return map
}

/** Letras de `needed` que aún no están en `used` (resta de multicomjuntos). */
export function remainingLetters(needed: string[], used: string[]): string[] {
  const left = letterCounts(needed)
  for (const ch of used) {
    const n = left.get(ch) ?? 0
    if (n <= 1) left.delete(ch)
    else left.set(ch, n - 1)
  }
  const out: string[] = []
  for (const [ch, n] of left) {
    for (let i = 0; i < n; i += 1) out.push(ch)
  }
  return out
}

/** Máscara: true si la letra de la casilla coincide con la palabra. */
export function correctPositionMask(filled: readonly Slot[], palabra: string): boolean[] {
  const target = [...palabra]
  return target.map((t, i) => filled[i] != null && filled[i] === t)
}

/**
 * Tras un fallo: fija TODAS las posiciones correctas del intento actual
 * y reconstruye el montón solo con lo que falta (sin duplicar).
 * No depende de un estado "locked" previo (evita closures obsoletos).
 */
export function keepCorrectRecycleWrong(
  slots: readonly Slot[],
  palabra: string,
): { slots: Slot[]; pool: string[]; locked: boolean[] } {
  const target = [...palabra]
  const locked = correctPositionMask(slots, palabra)
  const nextSlots: Slot[] = target.map((_, i) => (locked[i] ? (slots[i] as string) : null))
  const used = nextSlots.filter((ch): ch is string => ch != null)
  const pool = remainingLetters(target, used)
  return { slots: nextSlots, pool, locked }
}

/** Estado inicial: siempre al menos la primera letra colocada y bloqueada. */
export function initialBoard(palabra: string, scrambled: string[]): {
  slots: Slot[]
  pool: string[]
  locked: boolean[]
} {
  const letters = [...palabra]
  if (!letters[0]) {
    return { slots: [], pool: [...scrambled], locked: [] }
  }
  const first = letters[0]
  const pool = remainingLetters(letters, [first])
  const order: string[] = []
  const available = letterCounts(pool)
  for (const ch of scrambled) {
    const n = available.get(ch) ?? 0
    if (n > 0) {
      order.push(ch)
      if (n <= 1) available.delete(ch)
      else available.set(ch, n - 1)
    }
  }
  for (const [ch, n] of available) {
    for (let i = 0; i < n; i += 1) order.push(ch)
  }

  return {
    slots: [first, ...emptySlots(letters.length - 1)],
    pool: order,
    locked: letters.map((_, i) => i === 0),
  }
}

/** Invariante: letras en casillas + montón = letras de la palabra. */
export function boardLetterInvariant(slots: Slot[], pool: string[], palabra: string): boolean {
  const onBoard = [...slots.filter((ch): ch is string => ch != null), ...pool].sort().join('')
  const expected = [...palabra].sort().join('')
  return onBoard === expected
}
