import {
  COIN_LABEL,
  MONEY_ROUND_SIZE,
  type CoinEuro,
  type MoneyBuildQuestion,
  type MoneyMcqQuestion,
  type MoneyPlayMode,
  type MoneyQuestion,
} from '@/money/types'

function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

function randInt(rand: () => number, min: number, max: number) {
  return min + Math.floor(rand() * (max - min + 1))
}

export function formatEuro(cents: number): string {
  const euros = Math.floor(cents / 100)
  const c = cents % 100
  if (c === 0) return `${euros} €`
  return `${euros},${String(c).padStart(2, '0')} €`
}

function uniqueEuroOptions(correctCents: number, rand: () => number): string[] {
  const set = new Set<number>([correctCents])
  const deltas = [10, 20, 50, 100, 200, -10, -20, -50, 5, 1, 2]
  for (const d of deltas) {
    const v = correctCents + d
    if (v >= 0) set.add(v)
    if (set.size >= 4) break
  }
  while (set.size < 4) set.add(correctCents + randInt(rand, 1, 12) * 10)
  const vals = shuffle([...set].slice(0, 4), rand)
  if (!vals.includes(correctCents)) vals[0] = correctCents
  return vals.map(formatEuro)
}

/** Precio 12–80 € con céntimos a veces “sucios”. */
function randomPriceCents(rand: () => number): number {
  const euros = randInt(rand, 12, 80)
  const dirty = rand()
  const cents =
    dirty < 0.35
      ? randInt(rand, 0, 9) * 10
      : dirty < 0.55
        ? [5, 15, 25, 35, 45, 55, 65, 75, 85, 95][randInt(rand, 0, 9)]!
        : dirty < 0.75
          ? randInt(rand, 1, 99)
          : 0
  return euros * 100 + cents
}

function buildChange(seed: number, mode: MoneyPlayMode): MoneyMcqQuestion {
  const rand = mulberry32(seed)
  const price = randomPriceCents(rand)
  const payOptions = [20, 50, 100]
    .map((e) => e * 100)
    .filter((p) => p > price)
  const pay = payOptions[Math.floor(rand() * payOptions.length)] ?? Math.ceil(price / 1000) * 1000 + 1000
  const change = pay - price
  const options = uniqueEuroOptions(change, rand)
  return {
    kind: 'mcq',
    id: `ch-${seed}`,
    mode,
    prompt: '¿Cuánto te devuelven?',
    detail: `Cuesta ${formatEuro(price)} · Pagas ${formatEuro(pay)}`,
    options,
    correctIndex: options.indexOf(formatEuro(change)),
  }
}

/** ¿Cuánto falta para pagar el precio? */
function buildShortfall(seed: number, mode: MoneyPlayMode): MoneyMcqQuestion {
  const rand = mulberry32(seed)
  const price = randomPriceCents(rand)
  const haveEuros = randInt(rand, 5, Math.max(6, Math.floor(price / 100) - 1))
  const haveCents = rand() < 0.5 ? randInt(rand, 0, 99) : 0
  const have = haveEuros * 100 + haveCents
  const need = Math.max(1, price - have)
  const options = uniqueEuroOptions(need, rand)
  return {
    kind: 'mcq',
    id: `sf-${seed}`,
    mode,
    prompt: '¿Cuánto te falta?',
    detail: `Cuesta ${formatEuro(price)} · Tienes ${formatEuro(have)}`,
    options,
    correctIndex: options.indexOf(formatEuro(need)),
  }
}

function buildBuild(seed: number, mode: MoneyPlayMode): MoneyBuildQuestion {
  const rand = mulberry32(seed)
  const euros = randInt(rand, 3, 25)
  const cents = [0, 5, 10, 20, 25, 50, 75, 80, 1, 2][randInt(rand, 0, 9)]!
  const target = euros * 100 + cents
  const pool: CoinEuro[] = [200, 100, 50, 20, 10, 5, 2, 1]
  const coins = shuffle(pool, rand).slice(0, 6) as CoinEuro[]
  return {
    kind: 'build',
    id: `bd-${seed}`,
    mode,
    prompt: `Haz exactamente ${formatEuro(target)}`,
    targetCents: target,
    coins,
  }
}

function buildSpare(seed: number, mode: MoneyPlayMode): MoneyMcqQuestion {
  const rand = mulberry32(seed)
  const coins: CoinEuro[] = shuffle([200, 100, 50, 20, 10, 5], rand).slice(0, 4) as CoinEuro[]
  const spare = coins[Math.floor(rand() * coins.length)]!
  const rest = coins.filter((c) => c !== spare)
  const sumRest = rest.reduce((a, b) => a + b, 0)
  const options = shuffle(
    coins.map((c) => COIN_LABEL[c]),
    rand,
  )
  return {
    kind: 'mcq',
    id: `sp-${seed}`,
    mode,
    prompt: `Para formar ${formatEuro(sumRest)}, ¿cuál sobra?`,
    detail: coins.map((c) => COIN_LABEL[c]).join(' · '),
    options,
    correctIndex: options.indexOf(COIN_LABEL[spare]),
  }
}

function buildSum(seed: number, mode: MoneyPlayMode): MoneyMcqQuestion {
  const rand = mulberry32(seed)
  const bill = [500, 1000, 2000, 5000][Math.floor(rand() * 4)]!
  const c1 = [100, 200, 50, 20][Math.floor(rand() * 4)] as CoinEuro
  const c2 = [20, 10, 5, 2, 1, 50][Math.floor(rand() * 6)] as CoinEuro
  const c3 = rand() < 0.5 ? ([1, 2, 5, 10][Math.floor(rand() * 4)] as CoinEuro) : 0
  const total = bill + c1 + c2 + c3
  const options = uniqueEuroOptions(total, rand)
  const detailParts = [`Billete ${formatEuro(bill)}`, COIN_LABEL[c1], COIN_LABEL[c2]]
  if (c3) detailParts.push(COIN_LABEL[c3 as CoinEuro])
  return {
    kind: 'mcq',
    id: `sm-${seed}`,
    mode,
    prompt: '¿Cuánto dinero hay?',
    detail: detailParts.join(' + '),
    options,
    correctIndex: options.indexOf(formatEuro(total)),
  }
}

export function buildMoneyQuestion(mode: MoneyPlayMode, seed: number): MoneyQuestion {
  switch (mode) {
    case 'change':
      return buildChange(seed, mode)
    case 'build':
      return buildBuild(seed, mode)
    case 'spare':
      return buildSpare(seed, mode)
    case 'sum':
      return buildSum(seed, mode)
    case 'shortfall':
      return buildShortfall(seed, mode)
    case 'mix': {
      const rand = mulberry32(seed)
      const pick = (['change', 'build', 'shortfall', 'sum', 'spare'] as MoneyPlayMode[])[
        Math.floor(rand() * 5)
      ]!
      return buildMoneyQuestion(pick, seed)
    }
  }
}

export function buildMoneyRound(mode: MoneyPlayMode, count = MONEY_ROUND_SIZE, seed = Date.now()) {
  return Array.from({ length: count }, (_, i) => buildMoneyQuestion(mode, seed + i * 6151))
}
