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
    expect(items.length).toBeGreaterThanOrEqual(50)
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

  it('acepta nombres coordinados con «y» en cualquier orden', () => {
    expect(
      isOrderCorrect(
        ['Erik', 'y', 'Carlos', 'montan', 'en', 'bicicleta.'],
        ['Carlos', 'y', 'Erik', 'montan', 'en', 'bicicleta.'],
      ),
    ).toBe(true)
    expect(
      isOrderCorrect(
        ['a', 'Ángel.', 'y', 'a', 'Luca'],
        ['a', 'Luca', 'y', 'a', 'Ángel.'],
      ),
    ).toBe(true)
    // El resto de la frase sí importa
    expect(
      isOrderCorrect(
        ['Erik', 'y', 'Carlos', 'corren', 'en', 'el', 'parque.'],
        ['Erik', 'y', 'Carlos', 'montan', 'en', 'el', 'parque.'],
      ),
    ).toBe(false)
    // «noventa y nueve» no son nombres: no se reordenan
    expect(
      isOrderCorrect(
        ['Enzo', 'guarda', 'comida', 'para', 'las', 'nueve', 'y', 'noventa', 'noches.'],
        ['Enzo', 'guarda', 'comida', 'para', 'las', 'noventa', 'y', 'nueve', 'noches.'],
      ),
    ).toBe(false)
  })
})
