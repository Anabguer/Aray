import { describe, expect, it } from 'vitest'
import { formatTimeEs } from '@/clock/format'
import {
  assertUniformClockOptions,
  buildConvert24Question,
  buildMcqQuestion,
  buildMatchPairs,
  buildTrainQueue,
} from '@/clock/generator'
import type { ClockLang } from '@/clock/types'

const SEEDS = 150

describe('clock generator formato homogéneo', () => {
  for (const lang of ['es', 'ca'] as ClockLang[]) {
    it(`${lang}: MCQ solo minutos ×5 y formato homogéneo (${SEEDS} semillas)`, () => {
      for (let i = 0; i < SEEDS; i += 1) {
        const q = buildMcqQuestion(lang, 8000 + i * 31, undefined, false)
        expect(q.time.minute % 5).toBe(0)
        expect(q.kind).toBe('read')
        expect(() => assertUniformClockOptions(q.options)).not.toThrow()
        expect(q.options[q.correctIndex]).toBeTruthy()
        expect(new Set(q.options).size).toBe(4)
        if (lang === 'es') {
          for (const opt of q.options) {
            expect(opt).not.toMatch(/\by \d+\b/)
            expect(opt).not.toMatch(/\bmenos \d+\b/)
          }
        }
      }
    })

    it(`${lang}: cola train sin 24 h ni minutos finos`, () => {
      const train = buildTrainQueue(lang, 10, 42)
      expect(train).toHaveLength(10)
      for (const q of train) {
        expect(q.kind).not.toBe('convert24')
        expect(q.time.minute % 5).toBe(0)
        expect(() => assertUniformClockOptions(q.options)).not.toThrow()
      }
      const pairs = buildMatchPairs(lang, 4, 99)
      expect(pairs).toHaveLength(4)
      for (const p of pairs) {
        expect(p.time.minute % 5).toBe(0)
      }
      const labels = pairs.map((p) => p.label)
      expect(new Set(labels).size).toBe(4)
    })
  }

  it('ES minutos finos siguen formateables (legado), pero no se usan en cola', () => {
    expect(formatTimeEs({ hour: 2, minute: 3 })).toBe('las dos y tres')
    expect(formatTimeEs({ hour: 2, minute: 58 })).toBe('las dos y cincuenta y ocho')
  })

  it('convert24 sigue disponible como builder, pero fuera de Entrena', () => {
    for (let i = 0; i < 40; i += 1) {
      const q = buildConvert24Question(5000 + i * 17)
      expect(q.kind).toBe('convert24')
      expect(q.prompt).toBe('¿Cómo se escribe en 24 h?')
      expect(q.prompt).not.toMatch(/\d+:\d+/)
      expect(q.periodHint).toMatch(/mañana|tarde|mediodía|noche/)
      expect(q.options.every((o) => /^\d{2}:\d{2}$/.test(o))).toBe(true)
    }
  })
})
