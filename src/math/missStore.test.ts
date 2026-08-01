/**
 * Tests Mis fallos mates (calc / money / clocks).
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { buildCalcQuestion, buildCalcQueue } from '@/calc/generator'
import { buildMoneyQuestion, buildMoneyRound } from '@/money/generator'
import { buildMcqQuestion, buildTrainQueue } from '@/clock/generator'
import {
  buildCalcMissPayload,
  buildClockMissPayload,
  buildMoneyMissPayload,
  calcQuestionId,
  clockQuestionId,
  moneyQuestionId,
} from '@/math/missIds'
import {
  clearMathsMisses,
  countActiveMathsMisses,
  listActiveMathsMisses,
  loadMathsMisses,
  MATHS_MISS_CLEAR_STREAK,
  rebuildCalcFromMiss,
  rebuildClockFromMiss,
  rebuildMoneyFromMiss,
  recordMathsHit,
  recordMathsMiss,
} from '@/math/missStore'
import { missionEnergyConfig } from '@/config/rewardGoal'
import { DAILY_TASKS } from '@/daily/dailyTasks'

const PID = 'test-maths-misses'

beforeEach(() => {
  clearMathsMisses(PID)
})

describe('maths miss IDs deterministas', () => {
  it('calc: misma pregunta → mismo id; semillas distintas sin colisión masiva', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 120; i += 1) {
      const q = buildCalcQuestion('add', 7000 + i)
      const id = calcQuestionId(q)
      expect(id).toMatch(/^calc:/)
      expect(calcQuestionId(q)).toBe(id)
      ids.add(id)
    }
    expect(ids.size).toBeGreaterThan(80)
  })

  it('money: ids estables por contenido', () => {
    const a = buildMoneyQuestion('change', 42)
    const b = buildMoneyQuestion('change', 42)
    expect(moneyQuestionId(a)).toBe(moneyQuestionId(b))
    expect(moneyQuestionId(a)).toMatch(/^money:change:/)
  })

  it('clock ES/CA: ids deterministas y distintos por idioma/estilo', () => {
    const es = buildMcqQuestion('es', 55, { hour: 2, minute: 15 }, false)
    const ca = buildMcqQuestion('ca', 55, { hour: 2, minute: 15 }, false)
    expect(clockQuestionId(es, 'es')).toBe(clockQuestionId(es, 'es'))
    expect(clockQuestionId(es, 'es')).toMatch(/^clock:es:02:15:/)
    expect(clockQuestionId(ca, 'ca')).toMatch(/^clock:ca:02:15:/)
  })
})

describe('maths miss store', () => {
  it('guarda fallo sin duplicar entrada', () => {
    const q = buildCalcQuestion('add', 11)
    const payload = buildCalcMissPayload(q)
    recordMathsMiss(PID, payload)
    recordMathsMiss(PID, payload)
    const list = listActiveMathsMisses(PID, 'calc')
    expect(list).toHaveLength(1)
    expect(list[0]!.misses).toBe(2)
    expect(list[0]!.streakHits).toBe(0)
  })

  it('incrementa contador y reinicia racha al fallar de nuevo', () => {
    const q = buildCalcQuestion('sub', 22)
    const id = calcQuestionId(q)
    recordMathsMiss(PID, buildCalcMissPayload(q))
    recordMathsHit(PID, id)
    expect(loadMathsMisses(PID).entries[id]!.streakHits).toBe(1)
    recordMathsMiss(PID, buildCalcMissPayload(q))
    expect(loadMathsMisses(PID).entries[id]!.misses).toBe(2)
    expect(loadMathsMisses(PID).entries[id]!.streakHits).toBe(0)
  })

  it('elimina tras 3 aciertos posteriores', () => {
    const q = buildMoneyQuestion('sum', 33)
    const id = moneyQuestionId(q)
    recordMathsMiss(PID, buildMoneyMissPayload(q))
    for (let i = 0; i < MATHS_MISS_CLEAR_STREAK; i += 1) {
      recordMathsHit(PID, id)
    }
    expect(countActiveMathsMisses(PID, 'money')).toBe(0)
  })

  it('aísla categorías', () => {
    recordMathsMiss(PID, buildCalcMissPayload(buildCalcQuestion('add', 1)))
    recordMathsMiss(PID, buildMoneyMissPayload(buildMoneyQuestion('change', 2)))
    const clockQ = buildMcqQuestion('es', 3, { hour: 4, minute: 0 }, false)
    recordMathsMiss(PID, buildClockMissPayload(clockQ, 'es'))
    expect(countActiveMathsMisses(PID, 'calc')).toBe(1)
    expect(countActiveMathsMisses(PID, 'money')).toBe(1)
    expect(countActiveMathsMisses(PID, 'clocks')).toBe(1)
    expect(countActiveMathsMisses(PID)).toBe(3)
  })

  it('persiste tras recarga (reload store)', () => {
    const q = buildCalcQuestion('near10', 44)
    recordMathsMiss(PID, buildCalcMissPayload(q))
    const again = loadMathsMisses(PID)
    expect(Object.keys(again.entries)).toHaveLength(1)
  })
})

describe('reconstrucción exacta', () => {
  it('calc', () => {
    const q = buildCalcQuestion('order', 88)
    recordMathsMiss(PID, buildCalcMissPayload(q))
    const entry = listActiveMathsMisses(PID, 'calc')[0]!
    const rebuilt = rebuildCalcFromMiss(entry)
    expect(rebuilt).toEqual(entry.payload.question)
    expect(rebuilt).toEqual(q)
  })

  it('money', () => {
    const q = buildMoneyQuestion('build', 99)
    recordMathsMiss(PID, buildMoneyMissPayload(q))
    const entry = listActiveMathsMisses(PID, 'money')[0]!
    expect(rebuildMoneyFromMiss(entry)).toEqual(q)
  })

  it('clocks ES y CA', () => {
    for (const lang of ['es', 'ca'] as const) {
      clearMathsMisses(PID)
      const q = buildMcqQuestion(lang, 101 + lang.length, undefined, true)
      recordMathsMiss(PID, buildClockMissPayload(q, lang))
      const entry = listActiveMathsMisses(PID, 'clocks')[0]!
      const rebuilt = rebuildClockFromMiss(entry)
      expect(rebuilt.lang).toBe(lang)
      expect(rebuilt.question).toEqual(entry.payload.question)
      expect(rebuilt.question.options).toEqual(q.options)
      expect(rebuilt.question.correctIndex).toBe(q.correctIndex)
    }
  })

  it('generativo: colas no rompen reconstrucción', () => {
    for (let s = 0; s < 40; s += 1) {
      clearMathsMisses(PID)
      const cq = buildCalcQueue('mix', 3, 2000 + s)[0]!
      recordMathsMiss(PID, buildCalcMissPayload(cq))
      expect(rebuildCalcFromMiss(listActiveMathsMisses(PID, 'calc')[0]!)).toEqual(cq)

      const mq = buildMoneyRound('mix', 2, 3000 + s)[0]!
      clearMathsMisses(PID)
      recordMathsMiss(PID, buildMoneyMissPayload(mq))
      expect(rebuildMoneyFromMiss(listActiveMathsMisses(PID, 'money')[0]!)).toEqual(mq)

      const tq = buildTrainQueue(s % 2 === 0 ? 'es' : 'ca', 2, 4000 + s)[0]!
      const lang = s % 2 === 0 ? 'es' : 'ca'
      clearMathsMisses(PID)
      recordMathsMiss(PID, buildClockMissPayload(tq, lang))
      expect(rebuildClockFromMiss(listActiveMathsMisses(PID, 'clocks')[0]!).question).toEqual(tq)
    }
  })
})

describe('mis fallos UI gates + economía intacta', () => {
  it('count 0 ⇒ no hay pendientes (solo aparece con fallos)', () => {
    expect(countActiveMathsMisses(PID, 'calc')).toBe(0)
    recordMathsMiss(PID, buildCalcMissPayload(buildCalcQuestion('add', 5)))
    expect(countActiveMathsMisses(PID, 'calc')).toBe(1)
  })

  it('no altera cupos daily ni pesos de energía', () => {
    expect(DAILY_TASKS.find((t) => t.key === 'calc')?.target).toBe(5)
    expect(DAILY_TASKS.find((t) => t.key === 'money')?.target).toBe(1)
    expect(DAILY_TASKS.find((t) => t.key === 'clocks')?.target).toBe(2)
    expect(missionEnergyConfig.perUnit.calc).toBe(5)
    expect(missionEnergyConfig.perUnit.money).toBe(5)
    expect(missionEnergyConfig.perUnit.clocks).toBe(5)
  })
})
