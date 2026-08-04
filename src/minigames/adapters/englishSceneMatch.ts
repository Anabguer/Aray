/**
 * Empareja frase/chunk EN ↔ escena (tap-tap).
 * Escenas: tarjeta visual con icono + glosa (estilo Aray; sin clipart de ficha).
 */
import { getEnglishPack } from '@/feinetas/englishRegistry'
import type { EnglishLemma } from '@/feinetas/englishLemmaPack'

export const ENGLISH_MATCH_ROUNDS = 4
export const ENGLISH_MATCH_PAIRS = 4

export type EnglishMatchPair = {
  id: string
  left: string
  rightLabel: string
  icon: string
  tone: number
}

export type EnglishMatchBoard = {
  pairs: EnglishMatchPair[]
  leftOrder: string[]
  rightOrder: string[]
}

const ICONS: Record<string, string> = {
  tennis: '🎾',
  basketball: '🏀',
  football: '⚽',
  volleyball: '🏐',
  'table-tennis': '🏓',
  skateboard: '🛹',
  bike: '🚲',
  rollerblade: '🛼',
  swimming: '🏊',
  running: '🏃',
  skiing: '⛷️',
  'ice-skating': '⛸️',
  'get-up': '🛏️',
  breakfast: '🍳',
  shower: '🚿',
  teeth: '🦷',
  dressed: '👕',
  school: '🎒',
  lunch: '🍽️',
  homework: '📚',
  dinner: '🌙',
  bed: '😴',
  train: '🚆',
  car: '🚗',
  bus: '🚌',
  underground: '🚇',
  walk: '🚶',
  park: '🌳',
  mountains: '⛰️',
  beach: '🏖️',
  country: '🐄',
  lake: '🏞️',
  pool: '🏊',
  river: '🌊',
  valley: '🌄',
  sea: '🌊',
  forest: '🌲',
  town: '🏘️',
  village: '🏡',
}

function iconFor(lemma: EnglishLemma): string {
  const s = lemma.lemma.toLowerCase()
  if (s.includes('tennis') && s.includes('table')) return ICONS['table-tennis']!
  if (s.includes('tennis')) return ICONS.tennis!
  if (s.includes('basketball')) return ICONS.basketball!
  if (s.includes('football')) return ICONS.football!
  if (s.includes('volleyball')) return ICONS.volleyball!
  if (s.includes('skateboard')) return ICONS.skateboard!
  if (s.includes('bike')) return ICONS.bike!
  if (s.includes('roller')) return ICONS.rollerblade!
  if (s.includes('swim')) return ICONS.swimming!
  if (s.includes('running')) return ICONS.running!
  if (s.includes('ski')) return ICONS.skiing!
  if (s.includes('ice')) return ICONS['ice-skating']!
  if (s.includes('get up')) return ICONS['get-up']!
  if (s.includes('breakfast')) return ICONS.breakfast!
  if (s.includes('shower')) return ICONS.shower!
  if (s.includes('teeth')) return ICONS.teeth!
  if (s.includes('dressed')) return ICONS.dressed!
  if (s.includes('school')) return ICONS.school!
  if (s.includes('lunch')) return ICONS.lunch!
  if (s.includes('homework')) return ICONS.homework!
  if (s.includes('dinner')) return ICONS.dinner!
  if (s.includes('bed')) return ICONS.bed!
  if (s.includes('train')) return ICONS.train!
  if (s.includes('car')) return ICONS.car!
  if (s.includes('bus')) return ICONS.bus!
  if (s.includes('underground')) return ICONS.underground!
  if (s.includes('walk')) return ICONS.walk!
  if (s.includes('park')) return ICONS.park!
  if (s.includes('mountain')) return ICONS.mountains!
  if (s.includes('beach')) return ICONS.beach!
  if (s.includes('country')) return ICONS.country!
  if (s.includes('lake')) return ICONS.lake!
  if (s.includes('pool')) return ICONS.pool!
  if (s.includes('river')) return ICONS.river!
  if (s.includes('valley')) return ICONS.valley!
  if (s.includes('sea')) return ICONS.sea!
  if (s.includes('forest')) return ICONS.forest!
  if (s.includes('town')) return ICONS.town!
  if (s.includes('village')) return ICONS.village!
  return '✨'
}

function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], random: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function leftLabel(lemma: EnglishLemma, packId: string): string {
  if (packId === 'ingles-abilities') return lemma.lemma
  if (packId === 'ingles-routines') return `I ${lemma.lemma}.`
  if (packId === 'ingles-transport') {
    if (lemma.lemma === 'walk') return 'I walk to school.'
    if (lemma.lemma.startsWith('by ')) return `I go ${lemma.lemma}.`
    return lemma.lemma
  }
  if (packId === 'ingles-places') return lemma.lemma
  return lemma.lemma
}

export function buildEnglishMatchSession(
  packId: string,
  rounds = ENGLISH_MATCH_ROUNDS,
  seed = Date.now(),
): EnglishMatchBoard[] {
  const pack = getEnglishPack(packId)
  const pool = pack.lemmas.filter((L) => L.status !== 'deprecated')
  if (pool.length < ENGLISH_MATCH_PAIRS) {
    throw new Error(`[ingles-match] Pack sin suficientes lemas: ${packId}`)
  }
  const boards: EnglishMatchBoard[] = []
  for (let r = 0; r < rounds; r += 1) {
    const pick = shuffle(pool, mulberry32(seed + r * 9973)).slice(
      0,
      ENGLISH_MATCH_PAIRS,
    )
    const pairs: EnglishMatchPair[] = pick.map((L, i) => ({
      id: L.id,
      left: leftLabel(L, packId),
      rightLabel: L.glossEs,
      icon: iconFor(L),
      tone: i % 4,
    }))
    const ids = pairs.map((p) => p.id)
    boards.push({
      pairs,
      leftOrder: shuffle(ids, mulberry32(seed + r * 13 + 1)),
      rightOrder: shuffle(ids, mulberry32(seed + r * 17 + 2)),
    })
  }
  return boards
}
