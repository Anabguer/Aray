import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import packJson from '@feinetas/palabras/morfologia.json'
import {
  WORDS_MORPH_PAIR_SCHEMA_VERSION,
  assertValidWordsMorphPairPack,
  undirectedMorphKey,
  validateWordsMorphPairPack,
  type WordsMorphPairPack,
} from '@/feinetas/wordsMorphPairPack'

const EXPECTED_NUM_IDS = [
  'morph-num-casa-casas',
  'morph-num-mesa-mesas',
  'morph-num-silla-sillas',
  'morph-num-cama-camas',
  'morph-num-puerta-puertas',
  'morph-num-ventana-ventanas',
  'morph-num-libro-libros',
  'morph-num-gorro-gorros',
  'morph-num-zapato-zapatos',
  'morph-num-gato-gatos',
  'morph-num-amigo-amigos',
  'morph-num-amiga-amigas',
  'morph-num-red-redes',
  'morph-num-jugador-jugadores',
  'morph-num-arbol-arboles',
  'morph-num-pez-peces',
  'morph-num-lapiz-lapices',
  'morph-num-luz-luces',
] as const

const EXPECTED_GEN_IDS = [
  'morph-gen-amigo-amiga',
  'morph-gen-nino-nina',
  'morph-gen-abuelo-abuela',
  'morph-gen-hermano-hermana',
  'morph-gen-tio-tia',
  'morph-gen-primo-prima',
  'morph-gen-alumno-alumna',
  'morph-gen-profesor-profesora',
  'morph-gen-gato-gata',
] as const

const REMOVED_IDS = [
  'morph-num-lombriz-lombrices',
  'morph-num-perdiz-perdices',
] as const

describe('feinetas / palabras / morfologia', () => {
  it('pasa validación schemaVersion 1', () => {
    const issues = validateWordsMorphPairPack(packJson)
    expect(issues).toEqual([])
    assertValidWordsMorphPairPack(packJson)
    expect(packJson.schemaVersion).toBe(WORDS_MORPH_PAIR_SCHEMA_VERSION)
  })

  it('metadatos congelados y packKind correcto', () => {
    const pack = packJson as WordsMorphPairPack
    expect(pack.pack.id).toBe('palabras-morfologia')
    expect(pack.pack.ownerBank).toBe('BANCO_MORFOLOGIA.md')
    expect(pack.pack.packKind).toBe('morph-pair')
    expect(pack.pack.revisionStatus).toBe('frozen')
    expect(pack.pack.level).toBe('3-primaria')
    expect(pack.pack.locale).toBe('es-ES')
    expect(pack.pack.contentVersion).toBe(1)
  })

  it('tiene 18 number y 9 gender (27 total)', () => {
    const pack = packJson as WordsMorphPairPack
    const num = pack.items.filter((i) => i.axis === 'number')
    const gen = pack.items.filter((i) => i.axis === 'gender')
    expect(num).toHaveLength(18)
    expect(gen).toHaveLength(9)
    expect(pack.items).toHaveLength(27)
    expect(num.map((i) => i.id)).toEqual([...EXPECTED_NUM_IDS])
    expect(gen.map((i) => i.id)).toEqual([...EXPECTED_GEN_IDS])
  })

  it('no incluye los ítems recortados en auditoría', () => {
    const ids = new Set((packJson as WordsMorphPairPack).items.map((i) => i.id))
    for (const id of REMOVED_IDS) {
      expect(ids.has(id)).toBe(false)
    }
  })

  it('ids únicos', () => {
    const pack = packJson as WordsMorphPairPack
    const ids = pack.items.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('pares únicos por axis (sin espejos duplicados)', () => {
    const pack = packJson as WordsMorphPairPack
    const seen = new Set<string>()
    for (const item of pack.items) {
      const key = undirectedMorphKey(item.axis, item.formA, item.formB)
      expect(seen.has(key)).toBe(false)
      seen.add(key)
      expect(item.promptSide).toBe('either')
    }
  })

  it('difficulty 1–4 y formas no vacías', () => {
    const pack = packJson as WordsMorphPairPack
    for (const item of pack.items) {
      expect(item.difficulty).toBeGreaterThanOrEqual(1)
      expect(item.difficulty).toBeLessThanOrEqual(4)
      expect(item.formA.trim().length).toBeGreaterThan(0)
      expect(item.formB.trim().length).toBeGreaterThan(0)
      expect(item.formA.toLocaleLowerCase('es')).not.toBe(
        item.formB.toLocaleLowerCase('es'),
      )
    }
  })

  it('MD congelado y sin ítems activos de los recortes', () => {
    const mdPath = path.resolve(
      process.cwd(),
      'feinetas/editorial/BANCO_MORFOLOGIA.md',
    )
    const md = readFileSync(mdPath, 'utf8')
    const lower = md.toLocaleLowerCase('es')
    expect(lower).toContain('congelado')
    expect(lower).toContain('aprobado')
    expect(lower).not.toContain('revisión aparte')
    expect(md).not.toContain('### Id\nmorph-num-lombriz-lombrices')
    expect(md).not.toContain('### Id\nmorph-num-perdiz-perdices')
    expect(md).not.toMatch(/### Forma A\r?\nlombriz/)
    expect(md).not.toMatch(/### Forma A\r?\nperdiz/)
  })

  it('no está registrado en el catálogo de minijuegos (aún no conectado)', async () => {
    const { MINIGAME_CATALOG } = await import('@/minigames/catalog')
    const connected = MINIGAME_CATALOG.some(
      (g) =>
        g.packIds?.includes('palabras-morfologia') ||
        g.id.includes('singular') ||
        g.id.includes('plural') ||
        g.id.includes('masculino') ||
        g.id.includes('femenino') ||
        g.id.includes('morfolog'),
    )
    expect(connected).toBe(false)
  })
})
