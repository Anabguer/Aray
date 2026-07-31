import { describe, expect, it } from 'vitest'
import {
  formatTimeCaCampanar,
  formatTimeEs,
  nextClockHour,
} from '@/clock/format'
import type { ClockTime } from '@/clock/types'

function t(hour: number, minute: number): ClockTime {
  return { hour: hour as ClockTime['hour'], minute: minute as ClockTime['minute'] }
}

describe('formatTimeEs', () => {
  it('cubre en punto, cuarto, media y menos cuarto', () => {
    expect(formatTimeEs(t(1, 0))).toBe('la una en punto')
    expect(formatTimeEs(t(1, 15))).toBe('la una y cuarto')
    expect(formatTimeEs(t(1, 30))).toBe('la una y media')
    expect(formatTimeEs(t(1, 45))).toBe('las dos menos cuarto')
    expect(formatTimeEs(t(12, 45))).toBe('la una menos cuarto')
  })

  it('usa y / menos en minutos de 5', () => {
    expect(formatTimeEs(t(1, 5))).toBe('la una y cinco')
    expect(formatTimeEs(t(1, 25))).toBe('la una y veinticinco')
    expect(formatTimeEs(t(1, 35))).toBe('la una y treinta y cinco')
    expect(formatTimeEs(t(1, 50))).toBe('las dos menos diez')
    expect(formatTimeEs(t(1, 55))).toBe('las dos menos cinco')
  })
})

describe('formatTimeCaCampanar', () => {
  it('mira los quarts hacia la hora siguiente', () => {
    expect(formatTimeCaCampanar(t(1, 0))).toBe('la una en punt')
    expect(formatTimeCaCampanar(t(1, 15))).toBe('un quart de les dues')
    expect(formatTimeCaCampanar(t(1, 30))).toBe('dos quarts de les dues')
    expect(formatTimeCaCampanar(t(1, 45))).toBe('tres quarts de les dues')
    expect(formatTimeCaCampanar(t(10, 15))).toBe("un quart d'onze")
    expect(formatTimeCaCampanar(t(12, 30))).toBe("dos quarts d'una")
  })

  it('suma minutos al quart o a la hora pasada', () => {
    expect(formatTimeCaCampanar(t(1, 5))).toBe('la una i cinc')
    expect(formatTimeCaCampanar(t(1, 10))).toBe('la una i deu')
    expect(formatTimeCaCampanar(t(1, 25))).toBe('un quart i deu de les dues')
    expect(formatTimeCaCampanar(t(1, 35))).toBe('dos quarts i cinc de les dues')
    expect(formatTimeCaCampanar(t(1, 40))).toBe('dos quarts i deu de les dues')
    expect(formatTimeCaCampanar(t(1, 55))).toBe('tres quarts i deu de les dues')
  })
})

describe('nextClockHour', () => {
  it('cicla 12 → 1', () => {
    expect(nextClockHour(12)).toBe(1)
    expect(nextClockHour(1)).toBe(2)
  })
})
