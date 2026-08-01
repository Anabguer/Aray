import { SPELL_MODE_LABELS, type SpellPlayMode } from '@/spelling/types'
import type { MinigameDefinition } from '@/minigames/types'

const SPELL_MODES: SpellPlayMode[] = [
  'missing',
  'correct',
  'picture',
  'intruder',
  'complete',
  'mix',
  'review',
]

function spellingMinigame(mode: SpellPlayMode): MinigameDefinition {
  return {
    id: `spelling-${mode}`,
    area: 'languages',
    category: 'spelling',
    title: SPELL_MODE_LABELS[mode],
    href: `/missions/languages/spelling/${mode}`,
    mechanicId: 'legacy-spell',
    source: 'legacy',
    status: 'active',
    legacySpellMode: mode,
    packIds: [],
  }
}

/**
 * Catálogo único de minijuegos.
 * Fase 0: Ortografía = adaptadores legacy; Formar palabras = referencia pack+mecánica.
 */
export const MINIGAME_CATALOG: MinigameDefinition[] = [
  ...SPELL_MODES.map(spellingMinigame),
  {
    id: 'formar-palabras',
    area: 'languages',
    category: 'words',
    title: 'Formar palabras',
    href: '/missions/languages/formar-palabras',
    mechanicId: 'ordenar-letras',
    source: 'pack',
    status: 'active',
    packIds: ['formar-palabras'],
  },
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

export function spellingMinigameId(mode: SpellPlayMode): string {
  return `spelling-${mode}`
}

export function isSpellPlayMode(value: string): value is SpellPlayMode {
  return (SPELL_MODES as string[]).includes(value)
}
