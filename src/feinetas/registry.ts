/**
 * Registro de feinetas.
 * Cada id apunta a un JSON en /feinetas — sin bancos en código.
 */
import formarPalabras from '@feinetas/formar-palabras.json'
import type { FeinetaDocument, FeinetaId, FormarPalabrasFeineta } from '@/feinetas/types'

const REGISTRY: Partial<Record<FeinetaId, FeinetaDocument>> = {
  'formar-palabras': formarPalabras as FormarPalabrasFeineta,
  // Futuro: 'completar-palabra', 'r-rr', 'h', 'familias-palabras', 'sinonimos'
}

export function listRegisteredFeinetas(): FeinetaId[] {
  return Object.keys(REGISTRY) as FeinetaId[]
}

export function loadFeineta(id: FeinetaId): FeinetaDocument {
  const doc = REGISTRY[id]
  if (!doc) {
    throw new Error(`[feinetas] No hay banco registrado: ${id}`)
  }
  return doc
}

export function getFormarPalabrasBank(): FormarPalabrasFeineta {
  const doc = loadFeineta('formar-palabras') as FormarPalabrasFeineta
  if (!Array.isArray(doc.palabras) || doc.palabras.length === 0) {
    throw new Error('[feinetas] formar-palabras.json no tiene palabras')
  }
  return doc
}
