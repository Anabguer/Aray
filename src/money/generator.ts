import { mulberry32, randInt, shuffle } from '@/math/rng'
import {
  COIN_LABEL,
  MONEY_ROUND_SIZE,
  type CoinEuro,
  type MoneyBuildQuestion,
  type MoneyMcqQuestion,
  type MoneyPiece,
  type MoneyPlayMode,
  type MoneyQuestion,
} from '@/money/types'

const BILL_CENTS = [50000, 20000, 10000, 5000, 2000, 1000, 500] as const
const PIECE_COINS: CoinEuro[] = [200, 100, 50, 20, 10, 5, 2, 1]

/** Descompone un importe en billetes y monedas (greedy). Máx. `maxPieces`. */
export function decomposeToPieces(cents: number, maxPieces = 7): MoneyPiece[] {
  let left = Math.max(0, Math.floor(cents))
  const pieces: MoneyPiece[] = []
  for (const b of BILL_CENTS) {
    while (left >= b) {
      pieces.push({ kind: 'bill', cents: b })
      left -= b
    }
  }
  for (const c of PIECE_COINS) {
    while (left >= c) {
      pieces.push({ kind: 'coin', cents: c })
      left -= c
    }
  }
  if (pieces.length <= maxPieces) return pieces
  const head = pieces.slice(0, maxPieces - 1)
  const rest = pieces.slice(maxPieces - 1).reduce((sum, p) => sum + p.cents, 0)
  head.push({ kind: rest >= 500 ? 'bill' : 'coin', cents: rest })
  return head
}

export function formatEuro(cents: number): string {
  const euros = Math.floor(cents / 100)
  const c = cents % 100
  if (c === 0) return `${euros} €`
  return `${euros},${String(c).padStart(2, '0')} €`
}

/** Cambio exacto con monedas ilimitadas de las denominaciones dadas (como en UI). */
export function canMakeExact(targetCents: number, denoms: readonly CoinEuro[]): boolean {
  if (targetCents < 0) return false
  if (targetCents === 0) return true
  if (denoms.length === 0) return false
  const uniq = [...new Set(denoms)].filter((d) => d > 0).sort((a, b) => a - b)
  const dp = new Uint8Array(targetCents + 1)
  dp[0] = 1
  for (let a = 0; a <= targetCents; a += 1) {
    if (!dp[a]) continue
    for (const c of uniq) {
      const next = a + c
      if (next <= targetCents) dp[next] = 1
    }
  }
  return dp[targetCents] === 1
}

function uniqueEuroOptions(correctCents: number, rand: () => number): string[] {
  const set = new Set<number>([correctCents])
  const deltas = [10, 20, 50, 100, 200, -10, -20, -50, 5, 1, 2]
  for (const d of deltas) {
    const v = correctCents + d
    if (v >= 0) set.add(v)
    if (set.size >= 8) break
  }
  while (set.size < 4) set.add(correctCents + randInt(rand, 1, 12) * 10)
  const labels = new Set<string>()
  const vals: number[] = []
  for (const v of shuffle([...set], rand)) {
    const label = formatEuro(v)
    if (labels.has(label)) continue
    labels.add(label)
    vals.push(v)
    if (vals.length >= 4) break
  }
  while (vals.length < 4) {
    const v = correctCents + (vals.length + 1) * 10
    const label = formatEuro(v)
    if (!labels.has(label)) {
      labels.add(label)
      vals.push(v)
    } else {
      vals.push(correctCents + vals.length * 7 + 3)
    }
  }
  if (!vals.includes(correctCents)) vals[0] = correctCents
  const options = vals.slice(0, 4).map(formatEuro)
  // Garantizar etiqueta correcta única.
  const correctLabel = formatEuro(correctCents)
  if (!options.includes(correctLabel)) options[0] = correctLabel
  return options
}

/** Precio 12–80 € con céntimos “realistas” de 3.º. */
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

const ALL_COINS: CoinEuro[] = [200, 100, 50, 20, 10, 5, 2, 1]

/** Descompone target en monedas (greedy euro) → denominaciones necesarias. */
function greedyCoins(targetCents: number): CoinEuro[] {
  let left = targetCents
  const used: CoinEuro[] = []
  for (const c of ALL_COINS) {
    while (left >= c) {
      used.push(c)
      left -= c
    }
  }
  return used
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
    questionId: `money:change:${price}:${pay}`,
    mode,
    prompt: '¿Cuánto te devuelven?',
    detail: `Cuesta ${formatEuro(price)} · Pagas ${formatEuro(pay)}`,
    options,
    correctIndex: options.indexOf(formatEuro(change)),
  }
}

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
    questionId: `money:shortfall:${price}:${have}`,
    mode,
    prompt: '¿Cuánto te falta?',
    detail: `Cuesta ${formatEuro(price)} · Tienes ${formatEuro(have)}`,
    options,
    correctIndex: options.indexOf(formatEuro(need)),
  }
}

/**
 * Construye el precio: el pool de monedas SIEMPRE permite el target
 * (incluye las denominaciones de una solución greedy + señuelos).
 */
function buildBuild(seed: number, mode: MoneyPlayMode): MoneyBuildQuestion {
  const rand = mulberry32(seed)
  const euros = randInt(rand, 3, 25)
  const centsChoices = [0, 5, 10, 20, 25, 50, 75, 80, 1, 2, 15, 35, 45]
  const cents = centsChoices[randInt(rand, 0, centsChoices.length - 1)]!
  const target = euros * 100 + cents

  const solution = greedyCoins(target)
  const required = [...new Set(solution)] as CoinEuro[]
  // Evitar una sola moneda repetida de forma absurda: si solo hay un tipo, añade vecinos.
  const decoys = shuffle(
    ALL_COINS.filter((c) => !required.includes(c)),
    rand,
  )
  const poolSet = new Set<CoinEuro>(required)
  for (const d of decoys) {
    if (poolSet.size >= 6) break
    poolSet.add(d)
  }
  // Si el target es múltiplo de una sola moneda grande, incluir monedas pequeñas educativas.
  if (required.length <= 1) {
    for (const c of [100, 50, 20, 10, 5, 1] as CoinEuro[]) {
      poolSet.add(c)
      if (poolSet.size >= 5) break
    }
  }
  let coins = shuffle([...poolSet], rand).slice(0, 6) as CoinEuro[]
  // Garantía dura: si por recorte fallara, forzar required.
  if (!canMakeExact(target, coins)) {
    coins = shuffle([...new Set([...required, ...coins])], rand).slice(0, Math.max(6, required.length)) as CoinEuro[]
  }
  if (!canMakeExact(target, coins)) {
    coins = [...ALL_COINS]
  }

  return {
    kind: 'build',
    id: `bd-${seed}`,
    questionId: `money:build:${target}`,
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
  // Evitar ambigüedad: ninguna otra moneda puede ser “la que sobra” para el mismo total.
  const ambiguous = coins.some((c) => {
    if (c === spare) return false
    const altSum = coins.filter((x) => x !== c).reduce((a, b) => a + b, 0)
    return altSum === sumRest
  })
  if (ambiguous) {
    return buildSpare(seed + 917, mode)
  }
  const options = shuffle(
    coins.map((c) => COIN_LABEL[c]),
    rand,
  )
  return {
    kind: 'mcq',
    id: `sp-${seed}`,
    questionId: `money:spare:${sumRest}:${spare}`,
    mode,
    prompt: `Para formar ${formatEuro(sumRest)}, ¿cuál sobra?`,
    detail: coins.map((c) => COIN_LABEL[c]).join(' · '),
    pieces: coins.map((c) => ({ kind: 'coin' as const, cents: c })),
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
  const pieces: MoneyPiece[] = [
    { kind: 'bill', cents: bill },
    { kind: 'coin', cents: c1 },
    { kind: 'coin', cents: c2 },
  ]
  if (c3) pieces.push({ kind: 'coin', cents: c3 as CoinEuro })
  return {
    kind: 'mcq',
    id: `sm-${seed}`,
    questionId: `money:sum:${total}`,
    mode,
    prompt: '¿Cuánto dinero hay?',
    detail: detailParts.join(' + '),
    pieces,
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
