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
    if (n <= 0) continue
    if (n === 1) left.delete(ch)
    else left.set(ch, n - 1)
  }
  const out: string[] = []
  for (const [ch, n] of left) {
    for (let i = 0; i < n; i += 1) out.push(ch)
  }
  return out
}

/**
 * Montón visible ordenado según el scramble inicial.
 * Nunca inventa letras: solo reordena `remainingLetters`.
 */
export function orderPool(remaining: string[], scrambleOrder: string[]): string[] {
  const available = letterCounts(remaining)
  const ordered: string[] = []
  for (const ch of scrambleOrder) {
    const n = available.get(ch) ?? 0
    if (n > 0) {
      ordered.push(ch)
      if (n === 1) available.delete(ch)
      else available.set(ch, n - 1)
    }
  }
  for (const [ch, n] of available) {
    for (let i = 0; i < n; i += 1) ordered.push(ch)
  }
  return ordered
}

/** Pool derivado: imposible que haya más letras que huecos. */
export function derivedPool(palabra: string, slots: readonly Slot[], scrambleOrder: string[]): string[] {
  const used = slots.filter((ch): ch is string => ch != null)
  return orderPool(remainingLetters([...palabra], used), scrambleOrder)
}

export function correctPositionMask(filled: readonly Slot[], palabra: string): boolean[] {
  const target = [...palabra]
  return target.map((t, i) => filled[i] != null && filled[i] === t)
}

/**
 * Tras un fallo: deja solo las letras bien colocadas (bloqueadas)
 * y vacía el resto. El montón se recalcula fuera con derivedPool.
 */
export function lockCorrectClearWrong(
  slots: readonly Slot[],
  palabra: string,
): { slots: Slot[]; locked: boolean[] } {
  const locked = correctPositionMask(slots, palabra)
  const nextSlots: Slot[] = [...palabra].map((_, i) => (locked[i] ? (slots[i] as string) : null))
  return { slots: nextSlots, locked }
}

export function initialBoard(palabra: string, scrambled: string[]): {
  slots: Slot[]
  locked: boolean[]
  scrambleOrder: string[]
} {
  const letters = [...palabra]
  if (!letters[0]) {
    return { slots: [], locked: [], scrambleOrder: [...scrambled] }
  }
  return {
    slots: [letters[0], ...emptySlots(letters.length - 1)],
    locked: letters.map((_, i) => i === 0),
    scrambleOrder: [...scrambled],
  }
}

export function boardLetterInvariant(slots: Slot[], pool: string[], palabra: string): boolean {
  const onBoard = [...slots.filter((ch): ch is string => ch != null), ...pool].sort().join('')
  const expected = [...palabra].sort().join('')
  return onBoard === expected
}
