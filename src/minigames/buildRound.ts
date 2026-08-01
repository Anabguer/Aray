import type { FormarPalabrasRoundItem } from '@/feinetas'
import type { FormarPalabrasFeineta } from '@/feinetas/types'
import type { SpellPlayMode, SpellQuestion } from '@/spelling/types'
import type { CalcPlayMode } from '@/calc/types'
import type { MoneyPlayMode } from '@/money/types'
import type { ClockLang } from '@/clock/types'
import type { ProgressState } from '@/math/types'
import { getMinigame } from '@/minigames/catalog'
import {
  buildFormarPalabrasRoundForMinigame,
  type FormarPalabrasRoundOptions,
} from '@/minigames/adapters/formarPalabras'
import { buildOrtografiaCompleteRound } from '@/minigames/adapters/ortografiaComplete'
import { buildOrtografiaCorrectRound } from '@/minigames/adapters/ortografiaCorrect'
import { buildOrtografiaIntruderRound } from '@/minigames/adapters/ortografiaIntruder'
import { buildOrtografiaMissingRound } from '@/minigames/adapters/ortografiaMissing'
import { buildOrtografiaMixRound } from '@/minigames/adapters/ortografiaMix'
import { buildOrtografiaReviewRound } from '@/minigames/adapters/ortografiaReview'
import { buildCalcMathsRound } from '@/minigames/adapters/mathsCalc'
import { buildMoneyMathsRound } from '@/minigames/adapters/mathsMoney'
import {
  buildClocksMatchMathsRound,
  buildClocksTrainMathsRound,
} from '@/minigames/adapters/mathsClocks'
import {
  buildTablesMatchMathsRound,
  buildTablesTrainMathsRound,
} from '@/minigames/adapters/mathsTables'
import type { MathsQuestion } from '@/minigames/mathsContract'
import type { SpellMissEntry } from '@/spelling/missStore'

export type BuildRoundOptions = FormarPalabrasRoundOptions & {
  count?: number
  seed?: number
  preferMisses?: SpellMissEntry[]
  /** Idioma de horas (default es). */
  clockLang?: ClockLang
  /** Tablas seleccionadas (default [7]). */
  tables?: number[]
  /** Progreso para ponderación de tablas. */
  progress?: ProgressState
}

export type SpellMcqRound = {
  kind: 'spell-mcq'
  minigameId: string
  questions: SpellQuestion[]
}

export type OrdenarLetrasRound = {
  kind: 'ordenar-letras'
  minigameId: string
  meta: FormarPalabrasFeineta
  items: FormarPalabrasRoundItem[]
}

export type MathsRound = {
  kind: 'maths'
  minigameId: string
  questions: MathsQuestion[]
}

export type RoundResult = SpellMcqRound | OrdenarLetrasRound | MathsRound

function buildOrtografiaLemmaRound(
  mode: SpellPlayMode,
  opts: BuildRoundOptions,
): SpellQuestion[] {
  const count = opts.count
  const seed = opts.seed ?? Date.now()
  switch (mode) {
    case 'correct':
      return buildOrtografiaCorrectRound(count, seed, 'correct')
    case 'intruder':
      return buildOrtografiaIntruderRound(count, seed, 'intruder')
    case 'missing':
      return buildOrtografiaMissingRound(count, seed, 'missing')
    case 'picture':
      throw new Error(
        '[minigames] Modo Imagen desactivado hasta disponer de image.ref reales por lema',
      )
    case 'complete': {
      const preferKeys = opts.preferMisses?.map((m) => m.key)
      return buildOrtografiaCompleteRound(count, seed, preferKeys)
    }
    case 'mix':
      return buildOrtografiaMixRound(count, seed)
    case 'review':
      return buildOrtografiaReviewRound(count, seed, opts.preferMisses ?? [])
    default:
      throw new Error(`[minigames] Modo ortografía desconocido: ${mode}`)
  }
}

function buildMathsRound(
  minigameId: string,
  opts: BuildRoundOptions,
): MathsQuestion[] {
  const game = getMinigame(minigameId)
  const mode = game.mathPlayMode ?? ''
  const count = opts.count ?? 8
  const seed = opts.seed ?? Date.now()
  const category = game.category

  if (category === 'calc') {
    if (mode === 'misses' || mode === 'learn') {
      throw new Error(
        `[minigames] ${minigameId}: cola vía miss store / pantalla dedicada, no buildRound`,
      )
    }
    return buildCalcMathsRound(mode as CalcPlayMode, count, seed)
  }

  if (category === 'money') {
    if (mode === 'misses') {
      throw new Error(
        `[minigames] ${minigameId}: cola vía miss store, no buildRound`,
      )
    }
    return buildMoneyMathsRound(mode as MoneyPlayMode, count, seed)
  }

  if (category === 'clocks') {
    const lang = opts.clockLang ?? 'es'
    if (mode === 'train') return buildClocksTrainMathsRound(lang, count, seed)
    if (mode === 'match') return buildClocksMatchMathsRound(lang, count, seed)
    throw new Error(
      `[minigames] ${minigameId}: modo ${mode} usa pantalla dedicada (sin cola buildRound)`,
    )
  }

  if (category === 'tables') {
    const tables = opts.tables ?? [7]
    const progress = opts.progress
    if (mode === 'train' || mode === 'challenge') {
      if (!progress) {
        throw new Error(
          `[minigames] ${minigameId}: requiere opts.progress para ponderar hechos`,
        )
      }
      return buildTablesTrainMathsRound(tables, progress, count, seed, mode)
    }
    if (mode === 'match') {
      return buildTablesMatchMathsRound(tables[0] ?? 7)
    }
    throw new Error(
      `[minigames] ${minigameId}: modo ${mode} usa pantalla dedicada (sin cola buildRound)`,
    )
  }

  throw new Error(`[minigames] Categoría mates desconocida: ${category}`)
}

/**
 * Punto único: buildRound(minigameId).
 * Ortografía → packs. Matemáticas → adaptadores legacy (mismo contenido).
 */
export function buildRound(minigameId: string, opts: BuildRoundOptions = {}): RoundResult {
  const game = getMinigame(minigameId)

  if (game.mechanicId === 'ortografia-lemma-mcq') {
    const mode = (game.spellPlayMode ?? 'correct') as SpellPlayMode
    return {
      kind: 'spell-mcq',
      minigameId,
      questions: buildOrtografiaLemmaRound(mode, opts),
    }
  }

  if (game.id === 'formar-palabras' && game.mechanicId === 'ordenar-letras') {
    const round = buildFormarPalabrasRoundForMinigame(minigameId, opts)
    return {
      kind: 'ordenar-letras',
      minigameId,
      meta: round.meta,
      items: round.items,
    }
  }

  if (game.mechanicId === 'maths-legacy') {
    return {
      kind: 'maths',
      minigameId,
      questions: buildMathsRound(minigameId, opts),
    }
  }

  throw new Error(
    `[minigames] buildRound: sin adaptador para ${minigameId} (mecánica ${game.mechanicId})`,
  )
}
