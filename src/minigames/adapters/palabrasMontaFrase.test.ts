import { describe, expect, it } from 'vitest'
import {
  buildMontaFraseRound,
  isOrderCorrect,
  MONTA_FRASE_ROUND_SIZE,
} from '@/minigames/adapters/palabrasMontaFrase'
import { listMontaFraseItems } from '@/feinetas/wordsBanks'
import { assertValidWordsMontaFrasePack } from '@/feinetas/wordsMontaFrasePack'
import montaJson from '@feinetas/palabras/monta-frase.json'

describe('monta-frase', () => {
  it('pack válido y con amigos', () => {
    assertValidWordsMontaFrasePack(montaJson)
    const items = listMontaFraseItems()
    expect(items.length).toBeGreaterThanOrEqual(12)
    const blob = items.map((i) => i.tokens.join(' ')).join(' | ')
    expect(blob).toMatch(/Aray/)
    expect(blob).toMatch(/Roblox/)
  })

  it('ronda baraja y valida orden', () => {
    const round = buildMontaFraseRound(MONTA_FRASE_ROUND_SIZE, 42)
    expect(round).toHaveLength(MONTA_FRASE_ROUND_SIZE)
    for (const q of round) {
      expect(q.scrambled).toHaveLength(q.tokens.length)
      expect(isOrderCorrect(q.tokens, q.tokens)).toBe(true)
      expect(isOrderCorrect(q.scrambled, q.tokens)).toBe(
        q.scrambled.every((t, i) => t === q.tokens[i]),
      )
    }
  })
})
