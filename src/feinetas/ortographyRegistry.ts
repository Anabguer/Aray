/**
 * Registro estable de packs de lemas de ortografía (JSON_SPEC).
 * Independiente del registry de feinetas (formar-palabras).
 */
import type { OrtographyLemmaPack } from '@/feinetas/ortographyLemmaPack'
import { assertValidOrtographyLemmaPack } from '@/feinetas/ortographyLemmaPack'

import rr from '@feinetas/ortografia/rr.json'
import h from '@feinetas/ortografia/h.json'
import bv from '@feinetas/ortografia/bv.json'
import gj from '@feinetas/ortografia/gj.json'
import lly from '@feinetas/ortografia/lly.json'
import czqu from '@feinetas/ortografia/czqu.json'
import mpmb from '@feinetas/ortografia/mpmb.json'
import hayAhiAy from '@feinetas/ortografia/hay-ahi-ay.json'
import tildes from '@feinetas/ortografia/tildes.json'
import gu from '@feinetas/ortografia/gu.json'

/** Orden canónico de packs aprobados (Fase 1 + Fase 2). */
export const ORTOGRAPHY_PACK_IDS = [
  'ortografia-rr',
  'ortografia-h',
  'ortografia-bv',
  'ortografia-gj',
  'ortografia-lly',
  'ortografia-czqu',
  'ortografia-mpmb',
  'ortografia-hay-ahi-ay',
  'ortografia-tildes',
  'ortografia-gu',
] as const

export type OrtographyPackId = (typeof ORTOGRAPHY_PACK_IDS)[number]

const RAW_PACKS: unknown[] = [rr, h, bv, gj, lly, czqu, mpmb, hayAhiAy, tildes, gu]

function loadValidatedPacks(): OrtographyLemmaPack[] {
  return RAW_PACKS.map((raw) => {
    assertValidOrtographyLemmaPack(raw)
    return raw
  })
}

let cached: OrtographyLemmaPack[] | null = null

/** Packs validados (schemaVersion 1). Lanza si alguno falla. */
export function listOrtographyPacks(): OrtographyLemmaPack[] {
  if (!cached) cached = loadValidatedPacks()
  return cached
}

export function getOrtographyPack(packId: string): OrtographyLemmaPack {
  const pack = listOrtographyPacks().find((p) => p.pack.id === packId)
  if (!pack) throw new Error(`[ortografia] Pack no registrado: ${packId}`)
  return pack
}

export function isOrtographyPackId(id: string): id is OrtographyPackId {
  return (ORTOGRAPHY_PACK_IDS as readonly string[]).includes(id)
}
