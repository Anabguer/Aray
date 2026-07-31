import { describe, expect, it } from 'vitest'
import { sideRunEnergyForProgress } from '@/reward/sideRunSettle'

describe('sideRunEnergyForProgress', () => {
  it('da 0 sin aciertos', () => {
    expect(sideRunEnergyForProgress(30, 0, 12)).toBe(0)
  })

  it('da el total al completar', () => {
    expect(sideRunEnergyForProgress(30, 12, 12)).toBe(30)
  })

  it('reparte en proporción al salir a medias', () => {
    expect(sideRunEnergyForProgress(30, 3, 4)).toBe(23)
    expect(sideRunEnergyForProgress(20, 1, 10)).toBe(2)
  })
})
