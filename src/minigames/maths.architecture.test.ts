/**
 * Arquitectura Fase 4 mates: catálogo + adaptadores + contrato común.
 * No cambia pantallas ni generadores: solo normaliza salida.
 */
import { describe, expect, it } from 'vitest'
import { buildCalcQueue } from '@/calc/generator'
import { buildMoneyRound } from '@/money/generator'
import { buildTrainQueue as buildClockTrain } from '@/clock/generator'
import {
  buildRound,
  calcMinigameId,
  clocksMinigameId,
  getMechanic,
  getMinigame,
  isMcqIndexCorrect,
  listMechanics,
  listMinigames,
  minigamesForArea,
  minigamesForCategory,
  moneyMinigameId,
  tablesMinigameId,
} from '@/minigames'
import { calcQuestionToMaths } from '@/minigames/adapters/mathsCalc'
import { moneyQuestionToMaths } from '@/minigames/adapters/mathsMoney'
import { clockQuestionToMaths } from '@/minigames/adapters/mathsClocks'
import { createInitialProgress } from '@/progress/repository'
import type { CalcPlayMode } from '@/calc/types'
import type { MoneyPlayMode } from '@/money/types'

const CALC_MODES: CalcPlayMode[] = [
  'mix',
  'add',
  'sub',
  'missing',
  'doubles',
  'halves',
  'near10',
  'compare',
  'order',
  'truefalse',
]

const MONEY_MODES: MoneyPlayMode[] = [
  'mix',
  'change',
  'shortfall',
  'build',
  'sum',
  'spare',
]

describe('maths MINIGAME_CATALOG (Fase 4)', () => {
  it('registra tablas, cálculo, dinero y horas como legacy activos', () => {
    const maths = minigamesForArea('maths')
    expect(maths.length).toBeGreaterThanOrEqual(20)
    expect(maths.every((m) => m.source === 'legacy')).toBe(true)
    expect(maths.every((m) => m.mechanicId === 'maths-legacy')).toBe(true)
    expect(maths.every((m) => (m.skillIds?.length ?? 0) > 0)).toBe(true)
    expect(maths.every((m) => m.icon && m.href.startsWith('/missions/mates/'))).toBe(
      true,
    )

    expect(minigamesForCategory('calc').map((m) => m.mathPlayMode)).toContain('add')
    expect(minigamesForCategory('money').map((m) => m.mathPlayMode)).toContain('change')
    expect(minigamesForCategory('clocks').map((m) => m.mathPlayMode)).toEqual(
      expect.arrayContaining(['learn', 'train', 'match', 'misses']),
    )
    expect(minigamesForCategory('tables').map((m) => m.mathPlayMode)).toEqual(
      expect.arrayContaining(['learn', 'train', 'challenge', 'match', 'misses']),
    )
  })

  it('mantiene rutas actuales en href', () => {
    expect(getMinigame(calcMinigameId('mix')).href).toBe('/missions/mates/calc/mix')
    expect(getMinigame(moneyMinigameId('build')).href).toBe(
      '/missions/mates/money/build',
    )
    expect(getMinigame(clocksMinigameId('train')).href).toBe(
      '/missions/mates/clocks/train',
    )
    expect(getMinigame(tablesMinigameId('challenge')).href).toBe(
      '/missions/mates/tables/challenge',
    )
    expect(getMinigame(tablesMinigameId('misses')).href).toBe(
      '/missions/mates/tables/train',
    )
  })

  it('no rompe catálogo de ortografía / formar-palabras', () => {
    expect(getMinigame('spelling-correct').source).toBe('pack')
    expect(getMinigame('formar-palabras').mechanicId).toBe('ordenar-letras')
    expect(listMinigames().some((m) => m.area === 'languages')).toBe(true)
  })

  it('registra mecánica maths-legacy como temporaryLegacy', () => {
    expect(getMechanic('maths-legacy').temporaryLegacy).toBe(true)
    const ids = listMechanics().map((m) => m.id).sort()
    expect(ids).toContain('maths-legacy')
    expect(ids).toContain('ortografia-lemma-mcq')
  })
})

describe('adaptadores maths → contrato común', () => {
  it('calc: preguntas válidas y misma respuesta que el generador', () => {
    for (const mode of CALC_MODES) {
      const seed = 42_100 + mode.length
      const raw = buildCalcQueue(mode, 6, seed)
      const via = buildRound(calcMinigameId(mode), { count: 6, seed })
      expect(via.kind).toBe('maths')
      if (via.kind !== 'maths') return
      expect(via.questions).toHaveLength(raw.length)
      raw.forEach((q, i) => {
        const adapted = via.questions[i]!
        expect(adapted.skillId).toBe('calc')
        expect(adapted.questionId).toBeTruthy()
        if (q.kind === 'mcq') {
          expect(adapted.answer).toEqual({
            type: 'index',
            correctIndex: q.correctIndex,
          })
          expect(
            isMcqIndexCorrect(q.correctIndex, adapted.answer),
          ).toBe(true)
        }
        if (q.kind === 'order') {
          expect(adapted.answer).toEqual({
            type: 'order',
            sequence: q.answer,
          })
        }
        if (q.kind === 'truefalse') {
          expect(adapted.answer).toEqual({
            type: 'truefalse',
            isTrue: q.isTrue,
          })
        }
        if (q.kind === 'compare') {
          expect(adapted.answer).toEqual({
            type: 'compare',
            greater: q.greater,
          })
        }
        // Idempotencia del adaptador unitario
        expect(calcQuestionToMaths(q).answer).toEqual(adapted.answer)
      })
    }
  })

  it('money: preguntas válidas y misma respuesta que el generador', () => {
    for (const mode of MONEY_MODES) {
      const seed = 77_200 + mode.charCodeAt(0)
      const raw = buildMoneyRound(mode, 6, seed)
      const via = buildRound(moneyMinigameId(mode), { count: 6, seed })
      expect(via.kind).toBe('maths')
      if (via.kind !== 'maths') return
      expect(via.questions).toHaveLength(raw.length)
      raw.forEach((q, i) => {
        const adapted = via.questions[i]!
        expect(adapted.skillId).toBe('money')
        expect(moneyQuestionToMaths(q).questionId).toBe(adapted.questionId)
        if (q.kind === 'mcq') {
          expect(adapted.answer).toEqual({
            type: 'index',
            correctIndex: q.correctIndex,
          })
        } else {
          expect(adapted.answer).toEqual({
            type: 'build',
            targetCents: q.targetCents,
          })
        }
      })
    }
  })

  it('clocks ES/CA: train reconstruye índices correctos', () => {
    for (const lang of ['es', 'ca'] as const) {
      const seed = 91_300
      const raw = buildClockTrain(lang, 8, seed)
      const via = buildRound(clocksMinigameId('train'), {
        count: 8,
        seed,
        clockLang: lang,
      })
      expect(via.kind).toBe('maths')
      if (via.kind !== 'maths') return
      expect(via.questions).toHaveLength(raw.length)
      raw.forEach((q, i) => {
        const adapted = via.questions[i]!
        expect(adapted.answer).toEqual({
          type: 'index',
          correctIndex: q.correctIndex,
        })
        expect(clockQuestionToMaths(q, lang, 'train').options).toEqual(
          adapted.options,
        )
      })
    }
  })

  it('clocks match: pares válidos', () => {
    const via = buildRound(clocksMinigameId('match'), {
      count: 4,
      seed: 12,
      clockLang: 'es',
    })
    expect(via.kind).toBe('maths')
    if (via.kind !== 'maths') return
    expect(via.questions.length).toBe(4)
    for (const q of via.questions) {
      expect(q.answer.type).toBe('match')
      expect(q.modeId).toBe('match')
    }
  })

  it('tables train/challenge/match: preguntas válidas', () => {
    const progress = createInitialProgress()
    const train = buildRound(tablesMinigameId('train'), {
      count: 5,
      seed: 55,
      tables: [7],
      progress,
    })
    expect(train.kind).toBe('maths')
    if (train.kind !== 'maths') return
    expect(train.questions).toHaveLength(5)
    for (const q of train.questions) {
      expect(q.skillId).toBe('tables')
      expect(q.answer.type).toBe('index')
      expect(isMcqIndexCorrect((q.answer as { correctIndex: number }).correctIndex, q.answer)).toBe(
        true,
      )
    }

    const challenge = buildRound(tablesMinigameId('challenge'), {
      count: 3,
      seed: 56,
      tables: [3, 4],
      progress,
    })
    expect(challenge.kind).toBe('maths')

    const match = buildRound(tablesMinigameId('match'), {
      tables: [8],
      seed: 1,
    })
    expect(match.kind).toBe('maths')
    if (match.kind !== 'maths') return
    expect(match.questions.length).toBeGreaterThan(0)
    expect(match.questions.every((q) => q.answer.type === 'match')).toBe(true)
  })

  it('generativo: semillas distintas sin romper contrato', () => {
    for (let s = 0; s < 12; s += 1) {
      const via = buildRound(calcMinigameId('mix'), { count: 4, seed: 1000 + s * 97 })
      expect(via.kind).toBe('maths')
      if (via.kind !== 'maths') return
      for (const q of via.questions) {
        expect(q.questionId).toBeTruthy()
        expect(q.skillId).toBe('calc')
      }
    }
  })

  it('modos learn/misses no generan cola por buildRound (pantalla dedicada)', () => {
    expect(() =>
      buildRound(clocksMinigameId('learn'), { seed: 1 }),
    ).toThrow(/pantalla dedicada/)
    expect(() =>
      buildRound(calcMinigameId('misses'), { seed: 1 }),
    ).toThrow(/miss store/)
    expect(() =>
      buildRound(tablesMinigameId('learn'), { seed: 1, progress: createInitialProgress() }),
    ).toThrow(/pantalla dedicada/)
  })
})

describe('comportamiento usuario / economía intacta (smoke)', () => {
  it('no altera listado de mecánicas pack de ortografía', () => {
    expect(getMinigame('spelling-mix').packIds.length).toBeGreaterThan(0)
    expect(getMinigame(calcMinigameId('add')).packIds).toEqual([])
  })
})
