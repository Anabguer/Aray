import { describe, expect, it } from 'vitest'
import { explainSpellMistake } from '@/spelling/explain'

describe('explicación tras fallo', () => {
  it('explica hay vs ahí de forma breve', () => {
    const card = explainSpellMistake({
      mode: 'complete',
      rule: 'hay-ahi-ay',
      correct: 'hay',
      chosen: 'ahí',
    })
    expect(card.badge.toLowerCase()).toMatch(/hay/)
    expect(card.whyWrong.toLowerCase()).toMatch(/sitio|lugar/)
    expect(card.whyRight.toLowerCase()).toMatch(/haber|existe/)
  })

  it('explica hecho vs echo', () => {
    const card = explainSpellMistake({
      mode: 'complete',
      rule: 'hacer-echar',
      correct: 'hecho',
      chosen: 'echo',
    })
    expect(card.whyWrong.toLowerCase()).toMatch(/echar/)
    expect(card.whyRight.toLowerCase()).toMatch(/hacer/)
  })
})
