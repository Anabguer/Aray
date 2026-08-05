import {
  formatClockTime,
  formatDigital12,
  formatDigital24,
  toHour24,
} from '@/clock/format'
import {
  CLOCK_MINUTES,
  CLOCK_MINUTES_TRAIN,
  type ClockHour,
  type ClockLang,
  type ClockMatchPair,
  type ClockMcqQuestion,
  type ClockMinute,
  type ClockTime,
} from '@/clock/types'
import { mulberry32, shuffle } from '@/math/rng'
import { stampClockQuestion } from '@/math/missIds'

function pickHour(rand: () => number): ClockHour {
  return (1 + Math.floor(rand() * 12)) as ClockHour
}

function pickMinute(rand: () => number, fine: boolean): ClockMinute {
  const pool = fine ? CLOCK_MINUTES_TRAIN : CLOCK_MINUTES
  return pool[Math.floor(rand() * pool.length)]!
}

export function randomClockTime(rand: () => number = Math.random, fine = false): ClockTime {
  return { hour: pickHour(rand), minute: pickMinute(rand, fine) }
}

function shiftMinute(time: ClockTime, deltaSteps: number): ClockTime {
  const idx = CLOCK_MINUTES.indexOf(time.minute)
  if (idx < 0) {
    const next = (((time.minute + deltaSteps * 5) % 60) + 60) % 60
    let hour = time.hour
    if (time.minute + deltaSteps * 5 >= 60) hour = (hour === 12 ? 1 : hour + 1) as ClockHour
    if (time.minute + deltaSteps * 5 < 0) hour = (hour === 1 ? 12 : hour - 1) as ClockHour
    return { hour, minute: next }
  }
  const nextIdx = (idx + deltaSteps + CLOCK_MINUTES.length * 8) % CLOCK_MINUTES.length
  let hour = time.hour
  const raw = idx + deltaSteps
  if (raw >= CLOCK_MINUTES.length) hour = (hour === 12 ? 1 : hour + 1) as ClockHour
  if (raw < 0) hour = (hour === 1 ? 12 : hour - 1) as ClockHour
  return { hour, minute: CLOCK_MINUTES[nextIdx]! }
}

/** Estilo de etiqueta homogéneo dentro de una pregunta. */
export type ClockLabelStyle = 'natural' | 'digital'

export function clockLabelStyle(lang: ClockLang, time: ClockTime): ClockLabelStyle {
  if (lang === 'ca' && time.minute % 5 !== 0) return 'digital'
  return 'natural'
}

export function formatClockOption(
  time: ClockTime,
  lang: ClockLang,
  style: ClockLabelStyle,
): string {
  if (style === 'digital') return formatDigital12(time)
  return formatClockTime(time, lang)
}

function looksDigital(label: string): boolean {
  return /^\d{1,2}:\d{2}$/.test(label.trim())
}

/** Todas las opciones del mismo estilo; sin equivalentes duplicados. */
export function assertUniformClockOptions(options: string[]): void {
  if (options.length !== 4) throw new Error('need 4 options')
  if (new Set(options).size !== 4) throw new Error('duplicate options')
  const digitalCount = options.filter(looksDigital).length
  if (digitalCount !== 0 && digitalCount !== 4) {
    throw new Error(`mixed formats: ${options.join(' | ')}`)
  }
}

function uniqueLabels(
  correct: string,
  distractorTimes: ClockTime[],
  lang: ClockLang,
  style: ClockLabelStyle,
  seedTime: ClockTime,
  rand: () => number,
): string[] {
  const set = new Set<string>([correct])
  for (const t of distractorTimes) {
    if (t.hour === seedTime.hour && t.minute === seedTime.minute) continue
    // Natural CA solo con pasos de 5.
    if (style === 'natural' && lang === 'ca' && t.minute % 5 !== 0) continue
    set.add(formatClockOption(t, lang, style))
  }
  let guard = 0
  while (set.size < 4 && guard < 60) {
    guard += 1
    const fine = style === 'digital'
    const alt = randomClockTime(rand, fine)
    if (alt.hour === seedTime.hour && alt.minute === seedTime.minute) continue
    if (style === 'natural' && lang === 'ca' && alt.minute % 5 !== 0) {
      const snapped: ClockTime = {
        hour: alt.hour,
        minute: CLOCK_MINUTES[Math.floor(rand() * CLOCK_MINUTES.length)]!,
      }
      set.add(formatClockOption(snapped, lang, style))
      continue
    }
    set.add(formatClockOption(alt, lang, style))
  }
  return [...set].slice(0, 4)
}

export function buildMcqQuestion(
  lang: ClockLang,
  seed = Date.now(),
  fixed?: ClockTime,
  fine = false,
): ClockMcqQuestion {
  const rand = mulberry32(seed)
  const time = fixed ?? randomClockTime(rand, fine)
  const style = clockLabelStyle(lang, time)
  const correct = formatClockOption(time, lang, style)
  const distractorTimes: ClockTime[] = [
    shiftMinute(time, 1),
    shiftMinute(time, -1),
    shiftMinute(time, 3),
    style === 'digital'
      ? { hour: time.hour, minute: (time.minute + 7) % 60 }
      : shiftMinute(time, 2),
    {
      hour: (time.hour === 12 ? 1 : time.hour + 1) as ClockHour,
      minute: style === 'natural' && lang === 'ca' && time.minute % 5 !== 0
        ? 0
        : time.minute,
    },
  ]
  const labels = uniqueLabels(correct, distractorTimes, lang, style, time, rand)
  const options = shuffle(labels, rand)
  if (!options.includes(correct)) options[0] = correct
  while (options.length < 4) {
    options.push(formatClockOption(randomClockTime(rand, style === 'digital'), lang, style))
  }
  const uniq = [...new Set(options)].slice(0, 4)
  while (uniq.length < 4) {
    uniq.push(formatClockOption(randomClockTime(rand, style === 'digital'), lang, style))
  }
  if (!uniq.includes(correct)) uniq[0] = correct
  const finalOpts = shuffle(uniq.slice(0, 4), rand)
  if (!finalOpts.includes(correct)) finalOpts[0] = correct
  assertUniformClockOptions(finalOpts)
  return stampClockQuestion(
    {
      id: `mcq-${time.hour}-${time.minute}-${seed}`,
      time,
      correctIndex: finalOpts.indexOf(correct),
      options: finalOpts,
      kind: 'read',
    },
    lang,
  )
}

/** Equivalencia 12 h ↔ 24 h (saberes 3r–4t). */
export function buildConvert24Question(seed: number): ClockMcqQuestion {
  const rand = mulberry32(seed)
  const hour12 = pickHour(rand)
  const minute = CLOCK_MINUTES[Math.floor(rand() * CLOCK_MINUTES.length)]!
  const afternoon = rand() < 0.55
  const hour24 = toHour24(hour12, afternoon)
  const correct = formatDigital24(hour24, minute)
  const time: ClockTime = { hour: hour12, minute }

  const wrongs = [
    formatDigital24(toHour24(hour12, !afternoon), minute),
    formatDigital24((hour24 + 1) % 24, minute),
    formatDigital24(hour24, (minute + 15) % 60),
    formatDigital24(hour12 === 12 ? 12 : hour12, minute),
  ]
  const set = new Set<string>([correct, ...wrongs])
  const options = shuffle([...set].slice(0, 4), rand)
  if (!options.includes(correct)) options[0] = correct
  assertUniformClockOptions(options)

  const period =
    hour12 === 12
      ? afternoon
        ? 'del mediodía'
        : 'de la noche (medianoche)'
      : afternoon
        ? 'de la tarde'
        : 'de la mañana'

  return stampClockQuestion(
    {
      id: `c24-${seed}`,
      time,
      correctIndex: options.indexOf(correct),
      options,
      kind: 'convert24',
      // La hora se lee en el reloj; solo se indica la franja (mañana/tarde).
      prompt: '¿Cómo se escribe en 24 h?',
      periodHint: period,
    },
    'es', // lang ignorado en id c24
  )
}

export function buildTrainQueue(
  lang: ClockLang,
  count = 10,
  seed = Date.now(),
): ClockMcqQuestion[] {
  const seen = new Set<string>()
  const queue: ClockMcqQuestion[] = []
  let n = 0
  // Solo lectura analógica con minutos ×5. Sin conversión 24 h ni minutos finos.
  while (queue.length < count && n < count * 10) {
    n += 1
    const q = buildMcqQuestion(lang, seed + n * 9973, undefined, false)
    const key = `${q.time.hour}:${q.time.minute}`
    if (seen.has(key)) continue
    seen.add(key)
    queue.push(q)
  }
  while (queue.length < count) {
    queue.push(buildMcqQuestion(lang, seed + queue.length * 1331, undefined, false))
  }
  return queue
}

export function buildMatchPairs(
  lang: ClockLang,
  count = 4,
  seed = Date.now(),
): ClockMatchPair[] {
  const rand = mulberry32(seed)
  const seen = new Set<string>()
  const pairs: ClockMatchPair[] = []
  let n = 0
  while (pairs.length < count && n < count * 12) {
    n += 1
    // Empareja: pasos de 5 → formato natural homogéneo.
    const time = randomClockTime(rand, false)
    const key = `${time.hour}:${time.minute}`
    if (seen.has(key)) continue
    seen.add(key)
    pairs.push({
      id: `pair-${key}`,
      time,
      label: formatClockOption(time, lang, 'natural'),
    })
  }
  return pairs
}

export function shuffleLabels(pairs: ClockMatchPair[], seed: number): string[] {
  const rand = mulberry32(seed)
  return shuffle(
    pairs.map((p) => p.label),
    rand,
  )
}
