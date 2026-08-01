import { describe, expect, it } from 'vitest'
import { formatTimeEs } from '@/clock/format'
import {
  assertUniformClockOptions,
  buildMcqQuestion,
  buildMatchPairs,
  buildTrainQueue,
} from '@/clock/generator'
import type { ClockLang } from '@/clock/types'

const SEEDS = 150

describe('clock generator formato homogéneo', () => {
  for (const lang of ['es', 'ca'] as ClockLang[]) {
    it(`${lang}: MCQ sin mezclar natural y dígitos (${SEEDS} semillas)`, () => {
      for (let i = 0; i < SEEDS; i += 1) {
        const q = buildMcqQuestion(lang, 8000 + i * 31, undefined, true)
        expect(() => assertUniformClockOptions(q.options)).not.toThrow()
        expect(q.options[q.correctIndex]).toBeTruthy()
        expect(new Set(q.options).size).toBe(4)
        // ES nunca usa dígitos sueltos tipo "y 58"
        if (lang === 'es') {
          for (const opt of q.options) {
            expect(opt).not.toMatch(/\by \d+\b/)
            expect(opt).not.toMatch(/\bmenos \d+\b/)
          }
        }
      }
    })

    it(`${lang}: cola train y match coherentes`, () => {
      const train = buildTrainQueue(lang, 10, 42)
      expect(train).toHaveLength(10)
      for (const q of train) {
        expect(() => assertUniformClockOptions(q.options)).not.toThrow()
      }
      const pairs = buildMatchPairs(lang, 4, 99)
      expect(pairs).toHaveLength(4)
      const labels = pairs.map((p) => p.label)
      expect(new Set(labels).size).toBe(4)
    })
  }

  it('ES minutos finos en palabras', () => {
    expect(formatTimeEs({ hour: 2, minute: 3 })).toBe('las dos y tres')
    expect(formatTimeEs({ hour: 2, minute: 58 })).toBe('las dos y cincuenta y ocho')
  })
})
