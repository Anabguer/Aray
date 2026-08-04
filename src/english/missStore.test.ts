import { beforeEach, describe, expect, it } from 'vitest'
import {
  ENGLISH_MISS_CLEAR_STREAK,
  countActiveEnglishMisses,
  listActiveEnglishMisses,
  loadEnglishMisses,
  recordEnglishHit,
  recordEnglishMiss,
} from '@/english/missStore'

const PID = 'test-english-miss'

describe('english missStore', () => {
  beforeEach(() => {
    localStorage.removeItem(`afk.english.misses.v1.${PID}`)
  })

  it('guarda packId:lemmaId + modo y sube contador al repetir', () => {
    recordEnglishMiss(PID, {
      key: 'ingles-school:school-pencil',
      mode: 'meaning',
    })
    recordEnglishMiss(PID, {
      key: 'ingles-school:school-pencil',
      mode: 'translate',
    })
    const entries = listActiveEnglishMisses(PID, 'ingles-school')
    expect(entries).toHaveLength(1)
    expect(entries[0]!.misses).toBe(2)
    expect(entries[0]!.mode).toBe('translate')
    expect(countActiveEnglishMisses(PID, 'ingles-family')).toBe(0)
  })

  it('retira tras 3 aciertos seguidos sin nuevo fallo', () => {
    recordEnglishMiss(PID, {
      key: 'ingles-family:family-mother',
      mode: 'missing',
    })
    for (let i = 0; i < ENGLISH_MISS_CLEAR_STREAK; i += 1) {
      recordEnglishHit(PID, { key: 'ingles-family:family-mother' })
    }
    expect(countActiveEnglishMisses(PID, 'ingles-family')).toBe(0)
    expect(loadEnglishMisses(PID).entries['ingles-family:family-mother']).toBeUndefined()
  })

  it('un fallo reinicia la racha de aciertos', () => {
    const key = 'ingles-colours-numbers:colours-numbers-red'
    recordEnglishMiss(PID, { key, mode: 'meaning' })
    recordEnglishHit(PID, { key })
    recordEnglishHit(PID, { key })
    recordEnglishMiss(PID, { key, mode: 'translate' })
    expect(listActiveEnglishMisses(PID)[0]!.streakHits).toBe(0)
    expect(listActiveEnglishMisses(PID)[0]!.misses).toBe(2)
  })

  it('filtra fallos por varios packs (estación)', () => {
    recordEnglishMiss(PID, { key: 'ingles-food:food-apple', mode: 'meaning' })
    recordEnglishMiss(PID, { key: 'ingles-numbers:numbers-one', mode: 'translate' })
    recordEnglishMiss(PID, { key: 'ingles-there-is:there-is-a', mode: 'missing' })
    expect(countActiveEnglishMisses(PID, ['ingles-food', 'ingles-numbers'])).toBe(2)
    expect(countActiveEnglishMisses(PID, ['ingles-there-is'])).toBe(1)
  })
})
