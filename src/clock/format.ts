import type { ClockHour, ClockMinute, ClockTime } from '@/clock/types'

const ES_HOUR: Record<ClockHour, string> = {
  1: 'una',
  2: 'dos',
  3: 'tres',
  4: 'cuatro',
  5: 'cinco',
  6: 'seis',
  7: 'siete',
  8: 'ocho',
  9: 'nueve',
  10: 'diez',
  11: 'once',
  12: 'doce',
}

const ES_MINUTE_WORD: Record<number, string> = {
  1: 'uno',
  2: 'dos',
  3: 'tres',
  4: 'cuatro',
  5: 'cinco',
  6: 'seis',
  7: 'siete',
  8: 'ocho',
  9: 'nueve',
  10: 'diez',
  11: 'once',
  12: 'doce',
  13: 'trece',
  14: 'catorce',
  15: 'quince',
  16: 'dieciséis',
  17: 'diecisiete',
  18: 'dieciocho',
  19: 'diecinueve',
  20: 'veinte',
  21: 'veintiuno',
  22: 'veintidós',
  23: 'veintitrés',
  24: 'veinticuatro',
  25: 'veinticinco',
  26: 'veintiséis',
  27: 'veintisiete',
  28: 'veintiocho',
  29: 'veintinueve',
  30: 'treinta',
  31: 'treinta y uno',
  32: 'treinta y dos',
  33: 'treinta y tres',
  34: 'treinta y cuatro',
  35: 'treinta y cinco',
  36: 'treinta y seis',
  37: 'treinta y siete',
  38: 'treinta y ocho',
  39: 'treinta y nueve',
  40: 'cuarenta',
  41: 'cuarenta y uno',
  42: 'cuarenta y dos',
  43: 'cuarenta y tres',
  44: 'cuarenta y cuatro',
  45: 'cuarenta y cinco',
  46: 'cuarenta y seis',
  47: 'cuarenta y siete',
  48: 'cuarenta y ocho',
  49: 'cuarenta y nueve',
  50: 'cincuenta',
  51: 'cincuenta y uno',
  52: 'cincuenta y dos',
  53: 'cincuenta y tres',
  54: 'cincuenta y cuatro',
  55: 'cincuenta y cinco',
  56: 'cincuenta y seis',
  57: 'cincuenta y siete',
  58: 'cincuenta y ocho',
  59: 'cincuenta y nueve',
}

const CA_HOUR_NOUN: Record<ClockHour, string> = {
  1: 'una',
  2: 'dues',
  3: 'tres',
  4: 'quatre',
  5: 'cinc',
  6: 'sis',
  7: 'set',
  8: 'vuit',
  9: 'nou',
  10: 'deu',
  11: 'onze',
  12: 'dotze',
}

const CA_OF_HOUR: Record<ClockHour, string> = {
  1: "d'una",
  2: 'de les dues',
  3: 'de les tres',
  4: 'de les quatre',
  5: 'de les cinc',
  6: 'de les sis',
  7: 'de les set',
  8: 'de les vuit',
  9: 'de les nou',
  10: 'de les deu',
  11: "d'onze",
  12: 'de les dotze',
}

const CA_MINUTE: Record<5 | 10, string> = {
  5: 'cinc',
  10: 'deu',
}

export function nextClockHour(hour: ClockHour): ClockHour {
  return (hour === 12 ? 1 : hour + 1) as ClockHour
}

function esArticleHour(hour: ClockHour): string {
  return hour === 1 ? `la ${ES_HOUR[hour]}` : `las ${ES_HOUR[hour]}`
}

function caEnPunt(hour: ClockHour): string {
  return hour === 1
    ? `la ${CA_HOUR_NOUN[hour]} en punt`
    : `les ${CA_HOUR_NOUN[hour]} en punt`
}

function caPastHourAndMinutes(hour: ClockHour, minute: 5 | 10): string {
  const base = hour === 1 ? `la ${CA_HOUR_NOUN[hour]}` : `les ${CA_HOUR_NOUN[hour]}`
  return `${base} i ${CA_MINUTE[minute]}`
}

function esMinuteWord(n: number): string {
  const w = ES_MINUTE_WORD[n]
  if (!w) throw new Error(`Minuto ES sin palabra: ${n}`)
  return w
}

/** Digital 24 h (0–23). */
export function toHour24(hour12: ClockHour, afternoon: boolean): number {
  if (hour12 === 12) return afternoon ? 12 : 0
  return afternoon ? hour12 + 12 : hour12
}

export function formatDigital24(hour24: number, minute: number): string {
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function formatDigital12(time: ClockTime): string {
  return `${time.hour}:${String(time.minute).padStart(2, '0')}`
}

/**
 * Castellano escolar: y cuarto / y media; minutos finos con “y N”.
 */
export function formatTimeEs(time: ClockTime): string {
  const { hour, minute } = time
  const base = esArticleHour(hour)
  if (minute === 0) return `${base} en punto`
  if (minute === 15) return `${base} y cuarto`
  if (minute === 30) return `${base} y media`
  if (minute === 45) {
    return `${esArticleHour(nextClockHour(hour))} menos cuarto`
  }
  if (minute > 45 && minute % 5 === 0) {
    const rem = 60 - minute
    return `${esArticleHour(nextClockHour(hour))} menos ${esMinuteWord(rem)}`
  }
  return `${base} y ${esMinuteWord(minute)}`
}

/**
 * Catalán sistema de campanar (pasos de 5).
 * Minutos finos → lectura digital (saberes 12/24).
 */
export function formatTimeCaCampanar(time: ClockTime): string {
  const { hour, minute } = time
  if (minute % 5 !== 0) {
    return formatDigital12(time)
  }
  if (minute === 0) return caEnPunt(hour)
  if (minute === 5 || minute === 10) {
    return caPastHourAndMinutes(hour, minute)
  }

  const target = nextClockHour(hour)
  const of = CA_OF_HOUR[target]
  const quarter = Math.floor(minute / 15) as 1 | 2 | 3
  const rem = (minute % 15) as 0 | 5 | 10

  const quartWord =
    quarter === 1 ? 'un quart' : quarter === 2 ? 'dos quarts' : 'tres quarts'

  if (rem === 0) return `${quartWord} ${of}`
  if (rem === 5 || rem === 10) return `${quartWord} i ${CA_MINUTE[rem]} ${of}`
  return formatDigital12(time)
}

export function formatClockTime(time: ClockTime, lang: 'es' | 'ca'): string {
  return lang === 'ca' ? formatTimeCaCampanar(time) : formatTimeEs(time)
}

export function clockKey(time: ClockTime): string {
  return `${time.hour}:${String(time.minute).padStart(2, '0')}`
}

export function parseClockKey(key: string): ClockTime | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(key)
  if (!m) return null
  const hour = Number(m[1])
  const minute = Number(m[2])
  if (hour < 1 || hour > 12) return null
  if (minute < 0 || minute > 59) return null
  return { hour: hour as ClockHour, minute: minute as ClockMinute }
}
