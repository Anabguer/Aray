import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createEmptyStats } from '@/achievements/stats'
import {
  featureHubProgress,
  mathsHubProgressForZone,
  tablesHubProgress,
} from '@/features/maths/hubZoneProgress'
import { emptyTableProgress } from '@/math/tableMastery'
import { createInitialProgress } from '@/progress/repository'
import { detectMicroCelebrate } from '@/run/microCelebrate'

const ROOT = path.resolve(__dirname, '../../..')

function readSrc(rel: string): string {
  return readFileSync(path.join(ROOT, 'src', rel), 'utf8')
}

describe('hubZoneProgress', () => {
  it('tablas: sin practicar → Sin empezar', () => {
    const p = createInitialProgress()
    const view = tablesHubProgress(p)
    expect(view.percent).toBe(0)
    expect(view.label).toBe('Sin empezar')
    expect(view.stars).toBe(0)
  })

  it('tablas: cuenta domadas y estrellas', () => {
    const p = createInitialProgress()
    for (const n of [2, 3, 4, 5]) {
      p.tables[String(n)] = {
        ...emptyTableProgress(),
        practiced: true,
        everMastered: true,
        bestRoundScore: 9,
        masteryScore: 90,
      }
    }
    const view = tablesHubProgress(p)
    expect(view.label).toBe('4/8 domadas')
    expect(view.percent).toBeGreaterThan(0)
    expect(view.stars).toBeGreaterThan(0)
  })

  it('feature: sesiones suben nivel', () => {
    const empty = featureHubProgress(createEmptyStats().byFeature.calc)
    expect(empty.label).toBe('Sin empezar')
    const mid = featureHubProgress({ sessions: 4, perfect: 1, modes: ['mix', 'add'] })
    expect(mid.label).toBe('Nivel 2')
    expect(mid.percent).toBeGreaterThan(empty.percent)
  })

  it('mathsHubProgressForZone delega por zona', () => {
    const p = createInitialProgress()
    p.stats.byFeature.money.sessions = 3
    expect(mathsHubProgressForZone('money', p).label).toMatch(/Nivel/)
    expect(mathsHubProgressForZone('tables', p).label).toBe('Sin empezar')
  })
})

describe('microCelebrate', () => {
  it('racha 2 / 3 / 5 y récord de sesión', () => {
    expect(detectMicroCelebrate(0, 2, 0)?.kind).toBe('streakStart')
    expect(detectMicroCelebrate(2, 3, 2)?.message).toBe('¡Racha de 3!')
    expect(detectMicroCelebrate(4, 5, 4)?.message).toBe('¡Racha de 5!')
    expect(detectMicroCelebrate(5, 6, 5)?.kind).toBe('sessionBest')
    expect(detectMicroCelebrate(3, 2, 5)).toBeNull()
  })
})

describe('copy infantil (mates UX1)', () => {
  it('sustituye RUN / LOBBY / métricas técnicas en pantallas mates', () => {
    const side = readSrc('run/SideRunShell.tsx')
    const learn = readSrc('features/maths/LearnScreen.tsx')
    const match = readSrc('features/maths/MatchScreen.tsx')
    const header = readSrc('components/game/GameHeader.tsx')

    expect(side).toContain('EN JUEGO')
    expect(side).not.toContain('RUN ACTUAL')
    expect(side).not.toContain('SALIR DE LA RUN')
    expect(side).toContain('¿Sales ahora?')

    expect(learn).toContain('¡TERMINADO!')
    expect(learn).toContain('OTRA VEZ')
    expect(learn).toContain('OTRO RANDOM')
    expect(learn).toContain('fromRandom')
    expect(learn).not.toContain('RUN COMPLETA')
    expect(learn).not.toContain('OTRA RUN')

    expect(match).toContain('Hechas')
    expect(match).toContain('Quedan')
    expect(match).toContain('Meta ⚡')
    expect(match).not.toContain('Encontradas')
    expect(match).not.toContain('Restan')
    expect(match).not.toContain('Hasta ⚡')

    expect(header).toContain('>LOBBY<')
    expect(header).not.toMatch(/lobby-label">INICIO</)
  })
})
