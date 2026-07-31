import { formatClockTime } from '@/clock/format'
import {
  CLOCK_MINUTES,
  type ClockHour,
  type ClockLang,
  type ClockMatchPair,
  type ClockMcqQuestion,
  type ClockMinute,
  type ClockTime,
} from '@/clock/types'

function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function pickHour(rand: () => number): ClockHour {
  return (1 + Math.floor(rand() * 12)) as ClockHour
}

function pickMinute(rand: () => number): ClockMinute {
  return CLOCK_MINUTES[Math.floor(rand() * CLOCK_MINUTES.length)]!
}

export function randomClockTime(rand: () => number = Math.random): ClockTime {
  return { hour: pickHour(rand), minute: pickMinute(rand) }
}

function shiftMinute(time: ClockTime, deltaSteps: number): ClockTime {
  const idx = CLOCK_MINUTES.indexOf(time.minute)
  const nextIdx = (idx + deltaSteps + CLOCK_MINUTES.length * 8) % CLOCK_MINUTES.length
  let hour = time.hour
  const raw = idx + deltaSteps
  if (raw >= CLOCK_MINUTES.length) hour = (hour === 12 ? 1 : hour + 1) as ClockHour
  if (raw < 0) hour = (hour === 1 ? 12 : hour - 1) as ClockHour
  return { hour, minute: CLOCK_MINUTES[nextIdx]! }
}

function uniqueLabels(
  correct: string,
  distractors: string[],
  lang: ClockLang,
  seedTime: ClockTime,
  rand: () => number,
): string[] {
  const set = new Set<string>([correct])
  for (const d of distractors) {
    if (d !== correct) set.add(d)
  }
  let guard = 0
  while (set.size < 4 && guard < 40) {
    guard += 1
    const alt = randomClockTime(rand)
    if (alt.hour === seedTime.hour && alt.minute === seedTime.minute) continue
    set.add(formatClockTime(alt, lang))
  }
  return [...set].slice(0, 4)
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

export function buildMcqQuestion(
  lang: ClockLang,
  seed = Date.now(),
  fixed?: ClockTime,
): ClockMcqQuestion {
  const rand = mulberry32(seed)
  const time = fixed ?? randomClockTime(rand)
  const correct = formatClockTime(time, lang)
  const distractorTimes = [
    shiftMinute(time, 1),
    shiftMinute(time, -1),
    shiftMinute(time, 3),
    shiftMinute(time, -3),
    { hour: time.hour, minute: ((time.minute + 30) % 60) as ClockMinute },
    {
      hour: (time.hour === 12 ? 1 : time.hour + 1) as ClockHour,
      minute: time.minute,
    },
  ]
  const distractors = distractorTimes.map((t) => formatClockTime(t, lang))
  const labels = uniqueLabels(correct, distractors, lang, time, rand)
  const options = shuffle(labels, rand)
  // Asegurar que la correcta está
  if (!options.includes(correct)) {
    options[0] = correct
  }
  const correctIndex = options.indexOf(correct)
  return {
    id: `mcq-${time.hour}-${time.minute}-${seed}`,
    time,
    correctIndex,
    options,
  }
}

export function buildTrainQueue(
  lang: ClockLang,
  count = 10,
  seed = Date.now(),
): ClockMcqQuestion[] {
  const rand = mulberry32(seed)
  const seen = new Set<string>()
  const queue: ClockMcqQuestion[] = []
  let n = 0
  while (queue.length < count && n < count * 8) {
    n += 1
    const q = buildMcqQuestion(lang, seed + n * 9973, randomClockTime(rand))
    const key = `${q.time.hour}:${q.time.minute}`
    if (seen.has(key)) continue
    seen.add(key)
    queue.push(q)
  }
  while (queue.length < count) {
    queue.push(buildMcqQuestion(lang, seed + queue.length * 1331))
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
    const time = randomClockTime(rand)
    const key = `${time.hour}:${time.minute}`
    if (seen.has(key)) continue
    seen.add(key)
    pairs.push({
      id: `pair-${key}`,
      time,
      label: formatClockTime(time, lang),
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
