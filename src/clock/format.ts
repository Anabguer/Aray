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

const ES_MINUTE: Record<Exclude<ClockMinute, 0 | 15 | 30 | 45>, string> = {
  5: 'cinco',
  10: 'diez',
  20: 'veinte',
  25: 'veinticinco',
  35: 'treinta y cinco',
  40: 'cuarenta',
  50: 'diez',
  55: 'cinco',
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

/** Preposición + hora destino en sistema de campanar. */
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

const CA_MINUTE: Record<5 | 10 | 20 | 25 | 35 | 40 | 50 | 55, string> = {
  5: 'cinc',
  10: 'deu',
  20: 'vint',
  25: 'vint-i-cinc',
  35: 'cinc',
  40: 'deu',
  50: 'cinc',
  55: 'deu',
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
  const base =
    hour === 1 ? `la ${CA_HOUR_NOUN[hour]}` : `les ${CA_HOUR_NOUN[hour]}`
  return `${base} i ${CA_MINUTE[minute]}`
}

/**
 * Castellano escolar: y cuarto / y media; a partir de menos cuarto usa la hora siguiente.
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
  if (minute > 45) {
    const rem = (60 - minute) as 5 | 10
    return `${esArticleHour(nextClockHour(hour))} menos ${ES_MINUTE[rem === 5 ? 55 : 50]}`
  }
  // 5, 10, 20, 25, 35, 40
  return `${base} y ${ES_MINUTE[minute as keyof typeof ES_MINUTE]}`
}

/**
 * Catalán sistema de campanar: los quarts miran a la hora siguiente.
 * Antes del primer quart se suma a la hora pasada (la una i cinc…).
 */
export function formatTimeCaCampanar(time: ClockTime): string {
  const { hour, minute } = time
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
  return `${quartWord} i ${CA_MINUTE[rem]} ${of}`
}

export function formatClockTime(
  time: ClockTime,
  lang: 'es' | 'ca',
): string {
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
  if (minute < 0 || minute > 55 || minute % 5 !== 0) return null
  return { hour: hour as ClockHour, minute: minute as ClockMinute }
}
