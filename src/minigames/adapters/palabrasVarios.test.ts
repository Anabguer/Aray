import { describe, expect, it } from 'vitest'
import {
  buildVariosSession,
  VARIOS_ROUNDS,
} from '@/minigames/adapters/palabrasVarios'
import { listVariosParesItems } from '@/feinetas/wordsBanks'
import { assertValidWordsVariosParesPack } from '@/feinetas/wordsVariosParesPack'
import variosJson from '@feinetas/palabras/varios-pares.json'

describe('palabras varios', () => {
  it('pack válido', () => {
    assertValidWordsVariosParesPack(variosJson)
    expect(listVariosParesItems('pronoun-verb').length).toBeGreaterThanOrEqual(8)
    expect(listVariosParesItems('common-proper').length).toBeGreaterThanOrEqual(5)
  })

  it.each(['quien-hace-que', 'comun-propio'] as const)(
    'sesión %s con tableros válidos',
    (productId) => {
      const session = buildVariosSession(productId, VARIOS_ROUNDS, 11)
      expect(session).toHaveLength(VARIOS_ROUNDS)
      for (const board of session) {
        expect(board.pairs.length).toBeGreaterThanOrEqual(3)
        expect(board.rightOrder).toHaveLength(board.pairs.length)
        expect(board.prompt.length).toBeGreaterThan(0)
        expect(board.help.length).toBeGreaterThan(0)
      }
    },
  )
})
