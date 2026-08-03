import { SPELL_MODE_LABELS, type SpellPlayMode } from '@/spelling/types'
import { ORTOGRAPHY_PACK_IDS } from '@/feinetas/ortographyRegistry'
import { ORTOGRAPHY_FRASES_PACK_ID } from '@/minigames/adapters/ortografiaComplete'
import { ENGLISH_HUB_PACK_IDS } from '@/feinetas/englishRegistry'
import { ENGLISH_MODE_LABELS, type EnglishPlayMode } from '@/english/types'
import { CALC_MODE_LABELS, type CalcPlayMode } from '@/calc/types'
import { MONEY_MODE_LABELS, type MoneyPlayMode } from '@/money/types'
import type { MinigameDefinition, MathsPresentation } from '@/minigames/types'

const SPELL_MODES: SpellPlayMode[] = [
  'missing',
  'correct',
  'picture',
  'intruder',
  'complete',
  'mix',
  'review',
]

const LEMMA_PACK_IDS = [...ORTOGRAPHY_PACK_IDS]
const FRASE_PACK_IDS = [ORTOGRAPHY_FRASES_PACK_ID]
const ALL_ORTO_PACK_IDS = [...LEMMA_PACK_IDS, ...FRASE_PACK_IDS]

function packIdsForMode(mode: SpellPlayMode): string[] {
  if (mode === 'complete') return FRASE_PACK_IDS
  if (mode === 'mix' || mode === 'review') return ALL_ORTO_PACK_IDS
  return LEMMA_PACK_IDS
}

function spellingMinigame(mode: SpellPlayMode): MinigameDefinition {
  const pictureLocked = mode === 'picture'
  return {
    id: `spelling-${mode}`,
    area: 'languages',
    category: 'spelling',
    title: SPELL_MODE_LABELS[mode],
    href: `/missions/languages/spelling/${mode}`,
    mechanicId: 'ortografia-lemma-mcq',
    source: 'pack',
    status: pictureLocked ? 'coming-soon' : 'active',
    spellPlayMode: mode,
    skillIds: ['spelling-words'],
    presentation: mode === 'review' ? 'review' : 'mcq',
    packIds: packIdsForMode(mode),
  }
}

const CALC_PLAY_MODES: CalcPlayMode[] = [
  'mix',
  'add',
  'sub',
  'missing',
  'doubles',
  'halves',
  'near10',
  'compare',
  'order',
  'truefalse',
]

const CALC_ICONS: Record<CalcPlayMode | 'misses', string> = {
  mix: 'calc-mix',
  add: 'calc-add',
  sub: 'calc-sub',
  missing: 'calc-missing',
  doubles: 'calc-doubles',
  halves: 'calc-halves',
  near10: 'calc-near10',
  compare: 'calc-compare',
  order: 'calc-order',
  truefalse: 'calc-truefalse',
  misses: 'mis-fallos',
}

function calcPresentation(mode: CalcPlayMode | 'misses'): MathsPresentation {
  if (mode === 'misses') return 'review'
  if (mode === 'order') return 'order'
  if (mode === 'compare') return 'compare'
  if (mode === 'truefalse') return 'truefalse'
  return 'timer'
}

function calcMinigame(mode: CalcPlayMode | 'misses'): MinigameDefinition {
  return {
    id: calcMinigameId(mode),
    area: 'maths',
    category: 'calc',
    title: CALC_MODE_LABELS[mode],
    href: `/missions/mates/calc/${mode}`,
    mechanicId: 'maths-legacy',
    source: 'legacy',
    status: 'active',
    mathPlayMode: mode,
    icon: CALC_ICONS[mode],
    skillIds: ['calc-mental'],
    presentation: calcPresentation(mode),
    packIds: [],
  }
}

const MONEY_PLAY_MODES: MoneyPlayMode[] = [
  'mix',
  'change',
  'shortfall',
  'build',
  'sum',
  'spare',
]

const MONEY_ICONS: Record<MoneyPlayMode | 'misses', string> = {
  mix: 'money-mix',
  change: 'money-change',
  shortfall: 'money-change',
  build: 'money-build',
  sum: 'money-sum',
  spare: 'money-spare',
  misses: 'mis-fallos',
}

function moneyPresentation(mode: MoneyPlayMode | 'misses'): MathsPresentation {
  if (mode === 'misses') return 'review'
  if (mode === 'build') return 'build'
  return 'mcq'
}

function moneyMinigame(mode: MoneyPlayMode | 'misses'): MinigameDefinition {
  return {
    id: moneyMinigameId(mode),
    area: 'maths',
    category: 'money',
    title: MONEY_MODE_LABELS[mode],
    href: `/missions/mates/money/${mode}`,
    mechanicId: 'maths-legacy',
    source: 'legacy',
    status: 'active',
    mathPlayMode: mode,
    icon: MONEY_ICONS[mode],
    skillIds: ['money-euros'],
    presentation: moneyPresentation(mode),
    packIds: [],
  }
}

type ClocksMode = 'learn' | 'train' | 'match' | 'misses'

const CLOCKS_META: Record<
  ClocksMode,
  { title: string; href: string; icon: string; presentation: MathsPresentation }
> = {
  learn: {
    title: 'Aprende',
    href: '/missions/mates/clocks/learn',
    icon: 'aprende',
    presentation: 'learn',
  },
  train: {
    title: 'Entrena',
    href: '/missions/mates/clocks/train',
    icon: 'entrena',
    presentation: 'mcq',
  },
  match: {
    title: 'Empareja',
    href: '/missions/mates/clocks/match',
    icon: 'empareja',
    presentation: 'match',
  },
  misses: {
    title: 'Mis fallos',
    href: '/missions/mates/clocks/misses',
    icon: 'mis-fallos',
    presentation: 'review',
  },
}

function clocksMinigame(mode: ClocksMode): MinigameDefinition {
  const meta = CLOCKS_META[mode]
  return {
    id: clocksMinigameId(mode),
    area: 'maths',
    category: 'clocks',
    title: meta.title,
    href: meta.href,
    mechanicId: 'maths-legacy',
    source: 'legacy',
    status: 'active',
    mathPlayMode: mode,
    icon: meta.icon,
    skillIds: ['clock-hours'],
    presentation: meta.presentation,
    packIds: [],
  }
}

type TablesMode = 'learn' | 'train' | 'challenge' | 'match' | 'misses'

const TABLES_META: Record<
  TablesMode,
  { title: string; href: string; icon: string; presentation: MathsPresentation }
> = {
  learn: {
    title: 'Aprende',
    href: '/missions/mates/tables/learn',
    icon: 'aprende',
    presentation: 'learn',
  },
  train: {
    title: 'Entrena',
    href: '/missions/mates/tables/train',
    icon: 'entrena',
    presentation: 'mcq',
  },
  challenge: {
    title: 'Reto rápido',
    href: '/missions/mates/tables/challenge',
    icon: 'reto-rapido',
    presentation: 'timer',
  },
  match: {
    title: 'Empareja',
    href: '/missions/mates/tables/match',
    icon: 'empareja',
    presentation: 'match',
  },
  misses: {
    title: 'Mis fallos',
    href: '/missions/mates/tables/train',
    icon: 'mis-fallos',
    presentation: 'review',
  },
}

function tablesMinigame(mode: TablesMode): MinigameDefinition {
  const meta = TABLES_META[mode]
  return {
    id: tablesMinigameId(mode),
    area: 'maths',
    category: 'tables',
    title: meta.title,
    href: meta.href,
    mechanicId: 'maths-legacy',
    source: 'legacy',
    status: 'active',
    mathPlayMode: mode,
    icon: meta.icon,
    skillIds: ['mult-mix-2-9'],
    presentation: meta.presentation,
    packIds: [],
  }
}

/**
 * Catálogo único de minijuegos.
 * Ortografía: packs. Matemáticas: legacy procedural vía adaptadores (Fase 4).
 */
const ENGLISH_MODES: EnglishPlayMode[] = [
  'meaning',
  'translate',
  'intruder',
  'missing',
  'mix',
  'review',
]

function englishMinigame(mode: EnglishPlayMode): MinigameDefinition {
  return {
    id: `english-${mode}`,
    area: 'english',
    category: 'vocabulary',
    title: ENGLISH_MODE_LABELS[mode],
    href: `/missions/english`,
    mechanicId: 'english-lemma-mcq',
    source: 'pack',
    status: ENGLISH_HUB_PACK_IDS.length > 0 ? 'active' : 'coming-soon',
    englishPlayMode: mode,
    skillIds: ['english-vocabulary'],
    presentation: mode === 'review' ? 'review' : 'mcq',
    packIds: [...ENGLISH_HUB_PACK_IDS],
  }
}

export const MINIGAME_CATALOG: MinigameDefinition[] = [
  ...SPELL_MODES.map(spellingMinigame),
  ...ENGLISH_MODES.map(englishMinigame),
  {
    id: 'formar-palabras',
    area: 'languages',
    category: 'words',
    title: 'Formar palabras',
    href: '/missions/languages/formar-palabras',
    mechanicId: 'ordenar-letras',
    source: 'pack',
    status: 'active',
    skillIds: ['spelling-words'],
    packIds: ['formar-palabras'],
  },
  ...CALC_PLAY_MODES.map(calcMinigame),
  calcMinigame('misses'),
  ...MONEY_PLAY_MODES.map(moneyMinigame),
  moneyMinigame('misses'),
  ...(['learn', 'train', 'match', 'misses'] as const).map(clocksMinigame),
  ...(['learn', 'train', 'challenge', 'match', 'misses'] as const).map(tablesMinigame),
]

const BY_ID = new Map(MINIGAME_CATALOG.map((m) => [m.id, m]))

export function listMinigames(): MinigameDefinition[] {
  return [...MINIGAME_CATALOG]
}

export function getMinigame(id: string): MinigameDefinition {
  const m = BY_ID.get(id)
  if (!m) throw new Error(`[minigames] Minijuego no registrado: ${id}`)
  return m
}

export function hasMinigame(id: string): boolean {
  return BY_ID.has(id)
}

export function minigamesForCategory(category: string): MinigameDefinition[] {
  return MINIGAME_CATALOG.filter((m) => m.category === category && m.status === 'active')
}

export function minigamesForArea(area: MinigameDefinition['area']): MinigameDefinition[] {
  return MINIGAME_CATALOG.filter((m) => m.area === area && m.status === 'active')
}

export function spellingMinigameId(mode: SpellPlayMode): string {
  return `spelling-${mode}`
}

export function englishMinigameId(mode: EnglishPlayMode): string {
  return `english-${mode}`
}

export function calcMinigameId(mode: CalcPlayMode | 'misses'): string {
  return `calc-${mode}`
}

export function moneyMinigameId(mode: MoneyPlayMode | 'misses'): string {
  return `money-${mode}`
}

export function clocksMinigameId(mode: ClocksMode): string {
  return `clocks-${mode}`
}

export function tablesMinigameId(mode: TablesMode): string {
  return `tables-${mode}`
}

export function isSpellPlayMode(value: string): value is SpellPlayMode {
  return (SPELL_MODES as string[]).includes(value)
}
