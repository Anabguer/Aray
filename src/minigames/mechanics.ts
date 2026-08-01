import type { MechanicDefinition, MechanicId } from '@/minigames/types'

const MECHANICS: Record<MechanicId, MechanicDefinition> = {
  mcq: {
    id: 'mcq',
    label: 'Pregunta de opciones (MCQ)',
  },
  'ordenar-letras': {
    id: 'ordenar-letras',
    label: 'Ordenar letras para formar palabra',
  },
  'ortografia-lemma-mcq': {
    id: 'ortografia-lemma-mcq',
    label: 'Ortografía desde packs editoriales JSON',
  },
}

export function listMechanics(): MechanicDefinition[] {
  return Object.values(MECHANICS)
}

export function getMechanic(id: MechanicId): MechanicDefinition {
  const m = MECHANICS[id]
  if (!m) throw new Error(`[minigames] Mecánica desconocida: ${id}`)
  return m
}

export function hasMechanic(id: string): id is MechanicId {
  return id in MECHANICS
}
