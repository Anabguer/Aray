import { performance } from 'node:perf_hooks'
import { describe, expect, it } from 'vitest'
import rrPackJson from '@feinetas/ortografia/rr.json'
import {
  ORTOGRAPHY_SCHEMA_VERSION,
  assertValidOrtographyLemmaPack,
  validateOrtographyLemmaPack,
  type OrtographyLemma,
  type OrtographyLemmaPack,
} from '@/feinetas/ortographyLemmaPack'
import {
  buildOrtographyPackRound,
  collectDistractors,
  lemmaToCorrectMcq,
} from '@/feinetas/ortographyMcq'

assertValidOrtographyLemmaPack(rrPackJson)
const pack = rrPackJson as OrtographyLemmaPack

const EXPECTED = [
  'perro',
  'carro',
  'correr',
  'carrera',
  'alrededor',
  'tierra',
  'gorro',
  'arroz',
  'carretera',
  'oreja',
  'marrón',
  'cerrado',
  'terreno',
  'arriba',
  'sonrisa',
  'parar',
  'barrer',
  'enredar',
  'arrancar',
  'correcto',
  'borrón',
] as const

/** Adaptadores sintéticos: demuestran que el JSON basta sin mutarlo. */
function adaptMissing(lemma: OrtographyLemma): { display: string; hidden: string } {
  // Heurística de piloto: ocultar primera "rr" o primera "r" relevante.
  const idx = lemma.lemma.indexOf('rr')
  if (idx >= 0) {
    return {
      display: `${lemma.lemma.slice(0, idx)}__${lemma.lemma.slice(idx + 2)}`,
      hidden: 'rr',
    }
  }
  const r = lemma.lemma.search(/r/i)
  if (r >= 0) {
    return {
      display: `${lemma.lemma.slice(0, r)}_${lemma.lemma.slice(r + 1)}`,
      hidden: lemma.lemma[r]!,
    }
  }
  throw new Error(`No se pudo derivar hueco para ${lemma.id}`)
}

function adaptPicturePool(pack: OrtographyLemmaPack): OrtographyLemma[] {
  return pack.lemmas.filter((l) => l.image.recommended)
}

function adaptIntruder(lemma: OrtographyLemma, pack: OrtographyLemmaPack): string[] {
  const goods = pack.lemmas
    .filter((l) => l.id !== lemma.id && l.category === lemma.category)
    .map((l) => l.lemma)
    .slice(0, 2)
  const options = [lemma.errors[0]!, lemma.lemma, ...goods].slice(0, 4)
  return options
}

function adaptScramble(lemma: OrtographyLemma): string[] {
  return [...lemma.lemma].sort()
}

describe('Validación exhaustiva piloto RR', () => {
  it('carga el JSON y cumple schemaVersion 1', () => {
    expect(pack.schemaVersion).toBe(ORTOGRAPHY_SCHEMA_VERSION)
    expect(validateOrtographyLemmaPack(pack)).toEqual([])
    expect(pack.pack.id).toBe('ortografia-rr')
    expect(pack.pack.ownerBank).toBe('ERRORES_REALES_RR.md')
    expect(pack.pack.ruleFamily).toBe('r-rr')
    expect(typeof pack.pack.contentVersion).toBe('number')
  })

  it('expone exactamente 21 lemas accesibles del MD congelado', () => {
    expect(pack.lemmas).toHaveLength(21)
    expect(pack.lemmas.map((l) => l.lemma)).toEqual([...EXPECTED])
    for (const lemma of pack.lemmas) {
      expect(lemma.id.startsWith('rr-')).toBe(true)
      expect(lemma.ruleId).toBe('r-rr')
    }
  })

  it('no tiene ids ni lemas duplicados', () => {
    const ids = pack.lemmas.map((l) => l.id)
    const lemmas = pack.lemmas.map((l) => l.lemma.toLocaleLowerCase('es'))
    expect(new Set(ids).size).toBe(21)
    expect(new Set(lemmas).size).toBe(21)
  })

  it('tiene todos los campos obligatorios en cada registro', () => {
    for (const lemma of pack.lemmas) {
      expect(lemma.id.length).toBeGreaterThan(0)
      expect(lemma.lemma.length).toBeGreaterThan(0)
      expect(Array.isArray(lemma.errors)).toBe(true)
      expect(lemma.errors.length).toBeGreaterThanOrEqual(1)
      expect(lemma.ruleId).toBeTruthy()
      expect(lemma.ruleText).toBeTruthy()
      expect(['muy_frecuente', 'frecuente', 'poco_frecuente']).toContain(lemma.frequency)
      expect(typeof lemma.category).toBe('string')
      expect(typeof lemma.image.recommended).toBe('boolean')
      expect(lemma.image.ref).toBeNull()
    }
  })

  it('garantiza que ningún error coincide con el lema correcto', () => {
    for (const lemma of pack.lemmas) {
      const key = lemma.lemma.toLocaleLowerCase('es')
      for (const err of lemma.errors) {
        expect(err.toLocaleLowerCase('es')).not.toBe(key)
        expect(err.trim().length).toBeGreaterThan(0)
      }
      expect(new Set(lemma.errors.map((e) => e.toLocaleLowerCase('es'))).size).toBe(
        lemma.errors.length,
      )
    }
  })

  it('trata tip opcional: presente válido o ausente (nunca vacío)', () => {
    let withTip = 0
    let withoutTip = 0
    for (const lemma of pack.lemmas) {
      if (lemma.tip === undefined) {
        withoutTip += 1
        continue
      }
      withTip += 1
      expect(lemma.tip.trim().length).toBeGreaterThan(0)
      expect(lemma.tip.toLocaleLowerCase('es')).not.toContain(
        lemma.lemma.toLocaleLowerCase('es'),
      )
    }
    expect(withTip + withoutTip).toBe(21)
    // En RR actual todos tienen tip derivado de ruleText; el contrato admite ausencia.
    expect(withTip).toBeGreaterThan(0)
  })

  it('trata tags / secondaryRuleIds / notes opcionales sin romper lectura', () => {
    const marron = pack.lemmas.find((l) => l.lemma === 'marrón')!
    expect(marron.tags).toContain('tilde')
    expect(marron.secondaryRuleIds).toEqual(['tilde'])
    expect(typeof marron.notes === 'string' || marron.notes === undefined).toBe(true)

    for (const lemma of pack.lemmas) {
      if (lemma.tags) expect(Array.isArray(lemma.tags)).toBe(true)
      if (lemma.secondaryRuleIds) expect(Array.isArray(lemma.secondaryRuleIds)).toBe(true)
      // difficulty / status / legacyWordKey ausentes en piloto → OK
      expect(lemma.difficulty).toBeUndefined()
      expect(lemma.status).toBeUndefined()
      expect(lemma.legacyWordKey).toBeUndefined()
    }
  })

  it('el adaptador MCQ construye rondas completas sin mutar el JSON', () => {
    const snapshot = JSON.stringify(pack)
    const round = buildOrtographyPackRound(pack, 7)
    expect(round).toHaveLength(21)
    for (const q of round) {
      expect(q.options[q.correctIndex]).toBe(q.lemma)
      expect(q.options.length).toBeGreaterThanOrEqual(2)
      expect(q.options.length).toBeLessThanOrEqual(4)
    }
    expect(JSON.stringify(pack)).toBe(snapshot)
  })

  it('soporta adaptadores de otros modos sin campos nuevos en el JSON', () => {
    const snapshot = JSON.stringify(pack)

    // missing / letra que falta
    for (const lemma of pack.lemmas) {
      const m = adaptMissing(lemma)
      expect(m.display.includes('_')).toBe(true)
      expect(m.hidden.length).toBeGreaterThan(0)
    }

    // picture pool
    const pictured = adaptPicturePool(pack)
    expect(pictured.length).toBeGreaterThan(0)
    expect(pictured.every((l) => l.image.recommended)).toBe(true)
    expect(pictured.every((l) => l.image.ref === null)).toBe(true)

    // intruder
    for (const lemma of pack.lemmas) {
      const opts = adaptIntruder(lemma, pack)
      expect(opts.length).toBeGreaterThanOrEqual(2)
      expect(opts).toContain(lemma.errors[0])
    }

    // ordenar letras
    for (const lemma of pack.lemmas) {
      const letters = adaptScramble(lemma)
      expect(letters.sort().join('')).toBe([...lemma.lemma].sort().join(''))
    }

    // distractores MCQ solo del pack
    const allowed = new Set(
      pack.lemmas.flatMap((l) => [l.lemma, ...l.errors].map((s) => s.toLocaleLowerCase('es'))),
    )
    for (const lemma of pack.lemmas) {
      for (const d of collectDistractors(lemma, pack, 3)) {
        expect(allowed.has(d.toLocaleLowerCase('es'))).toBe(true)
      }
      const q = lemmaToCorrectMcq(lemma, pack, () => 0.11)
      for (const opt of q.options) {
        expect(allowed.has(opt.toLocaleLowerCase('es'))).toBe(true)
      }
    }

    expect(JSON.stringify(pack)).toBe(snapshot)
  })

  it('no importa ni depende del spelling legacy', async () => {
    // Este archivo de validación solo importa feinetas/* y el JSON.
    const mod = await import('@/feinetas/ortographyMcq')
    expect(typeof mod.buildOrtographyPackRound).toBe('function')
    // Smoke: el adaptador no expone APIs legacy.
    expect('buildSpellQuestion' in mod).toBe(false)
    expect('SPELL_BANK' in mod).toBe(false)
  })

  it('rinde bien: 200 rondas completas < 250ms', () => {
    const t0 = performance.now()
    for (let seed = 0; seed < 200; seed += 1) {
      const round = buildOrtographyPackRound(pack, seed)
      expect(round).toHaveLength(21)
    }
    const ms = performance.now() - t0
    expect(ms).toBeLessThan(250)
  })

  it('cobertura de frecuencias y categorías coherente con el MD', () => {
    const freq = Object.fromEntries(
      ['muy_frecuente', 'frecuente', 'poco_frecuente'].map((f) => [
        f,
        pack.lemmas.filter((l) => l.frequency === f).length,
      ]),
    )
    expect(freq).toEqual({ muy_frecuente: 8, frecuente: 9, poco_frecuente: 4 })

    const alrededor = pack.lemmas.find((l) => l.lemma === 'alrededor')!
    expect(alrededor.errors).toEqual(['alrrededor', 'arrededor'])
  })
})
