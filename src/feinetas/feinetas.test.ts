import { describe, expect, it } from 'vitest'
import {
  buildFormarPalabrasRound,
  getFormarPalabrasBank,
  listRegisteredFeinetas,
  loadFeineta,
} from '@/feinetas'

describe('feinetas / formar-palabras', () => {
  it('lee el banco solo desde el JSON (sin palabras en código)', () => {
    const bank = getFormarPalabrasBank()
    expect(bank.nombre).toBe('Formar palabras')
    expect(bank.objetivo_palabras).toBe(250)
    expect(bank.palabras.length).toBe(250)
    expect(bank.palabras.every((p) => typeof p.palabra === 'string' && p.palabra.length > 0)).toBe(
      true,
    )
  })

  it('buildFormarPalabrasRound usa solo ítems del JSON', () => {
    const bank = getFormarPalabrasBank()
    const ids = new Set(bank.palabras.map((p) => p.id))
    const round = buildFormarPalabrasRound(8, () => 0.42)
    expect(round.items).toHaveLength(8)
    for (const row of round.items) {
      expect(ids.has(row.item.id)).toBe(true)
      expect(row.scrambled.length).toBe([...row.item.palabra].length)
      expect([...row.scrambled].sort().join('')).toBe([...row.item.palabra].sort().join(''))
    }
  })

  it('registry preparado para más feinetas', () => {
    expect(listRegisteredFeinetas()).toContain('formar-palabras')
    expect(loadFeineta('formar-palabras').version).toBe(1)
  })
})
