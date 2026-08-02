/** Lógica pura de Formar palabras (ayuda + letras fijas en verde). */

export type Slot = string | null

export function emptySlots(n: number): Slot[] {
  return Array.from({ length: n }, () => null)
}

/** Quita la primera aparición de `letter` del pool desordenado. */
export function poolWithoutFirst(scrambled: string[], letter: string): Array<string | null> {
  let removed = false
  return scrambled.map((ch) => {
    if (!removed && ch === letter) {
      removed = true
      return null
    }
    return ch
  })
}

/** Máscara: true si la letra de la casilla coincide con la palabra. */
export function correctPositionMask(filled: string[], palabra: string): boolean[] {
  const target = [...palabra]
  return filled.map((ch, i) => ch === target[i])
}

/**
 * Tras un fallo: conserva letras bien colocadas, devuelve las demás al pool.
 * `locked` marca casillas que no se pueden quitar (pista inicial + aciertos parciales).
 */
export function keepCorrectRecycleWrong(
  slots: Slot[],
  pool: Array<string | null>,
  palabra: string,
  previouslyLocked: boolean[],
): { slots: Slot[]; pool: Array<string | null>; locked: boolean[] } {
  const target = [...palabra]
  const nextSlots = [...slots]
  const nextPool = [...pool]
  const locked = previouslyLocked.map((was, i) => {
    const ch = slots[i]
    if (ch != null && ch === target[i]) return true
    return was
  })

  for (let i = 0; i < nextSlots.length; i += 1) {
    if (locked[i]) continue
    const ch = nextSlots[i]
    if (ch == null) continue
    nextSlots[i] = null
    const emptyPool = nextPool.findIndex((p) => p == null)
    if (emptyPool >= 0) nextPool[emptyPool] = ch
    else nextPool.push(ch)
  }

  return { slots: nextSlots, pool: nextPool, locked }
}

/** Estado inicial: siempre al menos la primera letra colocada y bloqueada. */
export function initialBoard(palabra: string, scrambled: string[]): {
  slots: Slot[]
  pool: Array<string | null>
  locked: boolean[]
} {
  const letters = [...palabra]
  if (!letters[0]) {
    return { slots: [], pool: [...scrambled], locked: [] }
  }
  const first = letters[0]
  return {
    slots: [first, ...emptySlots(letters.length - 1)],
    pool: poolWithoutFirst(scrambled, first),
    locked: letters.map((_, i) => i === 0),
  }
}
