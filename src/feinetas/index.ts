import { getFormarPalabrasBank } from '@/feinetas/registry'
import type { FormarPalabraItem, FormarPalabrasFeineta } from '@/feinetas/types'

export type FormarPalabrasRoundItem = {
  item: FormarPalabraItem
  /** Letras desordenadas (misma longitud que la palabra). */
  scrambled: string[]
}

function shuffleLetters(letters: string[], random: () => number): string[] {
  const out = [...letters]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  // Evitar que quede ya ordenada (salvo palabras de 1 letra).
  if (out.length > 1 && out.join('') === letters.join('')) {
    ;[out[0], out[out.length - 1]] = [out[out.length - 1]!, out[0]!]
  }
  return out
}

/** Ronda sacada SOLO del JSON feinetas/formar-palabras.json. */
export function buildFormarPalabrasRound(
  count = 8,
  random: () => number = Math.random,
): { meta: FormarPalabrasFeineta; items: FormarPalabrasRoundItem[] } {
  const meta = getFormarPalabrasBank()
  const pool = [...meta.palabras]
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
  }
  const picked = pool.slice(0, Math.min(count, pool.length))
  const items = picked.map((item) => {
    const letters = [...item.palabra]
    return {
      item,
      scrambled: shuffleLetters(letters, random),
    }
  })
  return { meta, items }
}

export {
  getFormarPalabrasBank,
  listRegisteredFeinetas,
  loadFeineta,
} from '@/feinetas/registry'
export type * from '@/feinetas/types'
