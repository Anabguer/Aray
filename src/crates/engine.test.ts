import { describe, expect, it } from 'vitest'
import { crateConfig } from '@/config/crateConfig'
import { tableArt } from '@/assets/tables'
import { crateArt } from '@/assets/rewards'
import { PLAYABLE_TABLES } from '@/config/playConfig'
import {
  chooseCrateOption,
  collectPendingCrate,
  createInitialCratesState,
  makeChoiceCratePair,
  markCrateOpened,
  mergeCratesState,
  rollCrateForCompletion,
} from '@/crates/engine'

describe('assets de niveles y cajas', () => {
  it('resuelve imagen por tabla 2–9', () => {
    for (const n of PLAYABLE_TABLES) {
      expect(tableArt[n]).toBeTruthy()
      expect(String(tableArt[n])).toContain('tabla-')
    }
  })

  it('resuelve arte de cajas por rareza', () => {
    expect(crateArt.normal).toBeTruthy()
    expect(crateArt.especial).toBeTruthy()
    expect(crateArt.epica).toBeTruthy()
  })
})

describe('sistema de cajas', () => {
  it('los pesos de rareza suman 100', () => {
    const sum = Object.values(crateConfig.rarityWeights).reduce((a, b) => a + b, 0)
    expect(sum).toBe(100)
  })

  it('una finalización solo tira una vez (idempotente)', () => {
    const rng = (() => {
      let i = 0
      const seq = [0.01, 0.5, 0.2, 0.3, 0.4]
      return () => seq[i++ % seq.length]!
    })()
    const first = rollCrateForCompletion({
      completionId: 'sess-1',
      activity: 'train',
      crates: createInitialCratesState(),
      random: rng,
    })
    expect(first.rolled).toBe(true)
    const second = rollCrateForCompletion({
      completionId: 'sess-1',
      activity: 'train',
      crates: first.crates,
      random: () => 0,
    })
    expect(second.rolled).toBe(false)
    expect(second.crates.pending?.reward).toEqual(first.crates.pending?.reward)
  })

  it('nunca genera caja vacía ni premio negativo', () => {
    for (let i = 0; i < 40; i += 1) {
      const roll = rollCrateForCompletion({
        completionId: `s-${i}`,
        activity: 'firstMastery',
        crates: createInitialCratesState(),
        newlyMasteredTable: '7',
        random: () => (i % 97) / 97,
      })
      if (!roll.pending) continue
      expect(roll.pending.reward.amount).toBeGreaterThan(0)
      for (const opt of roll.pending.options) {
        expect(opt.reward.amount).toBeGreaterThan(0)
      }
    }
  })

  it('protección de mala suerte garantiza caja', () => {
    let crates = createInitialCratesState()
    crates.pityWithoutCrate = 4
    const roll = rollCrateForCompletion({
      completionId: 'pity',
      activity: 'train',
      crates,
      random: () => 0.99,
    })
    expect(roll.pending).not.toBeNull()
    expect(roll.crates.pityWithoutCrate).toBe(0)
  })

  it('primera dominación garantiza caja una sola vez por tabla', () => {
    const a = rollCrateForCompletion({
      completionId: 'm1',
      activity: 'train',
      crates: createInitialCratesState(),
      newlyMasteredTable: '5',
      random: () => 0.99,
    })
    expect(a.pending).not.toBeNull()
    expect(a.crates.firstMasteryGrantedTables).toContain('5')
    const b = rollCrateForCompletion({
      completionId: 'm2',
      activity: 'train',
      crates: { ...a.crates, pending: null, pityWithoutCrate: 0 },
      newlyMasteredTable: '5',
      random: () => 0.99,
    })
    // no guaranteed path; may or may not drop — but firstMastery list stays
    expect(b.crates.firstMasteryGrantedTables).toContain('5')
  })

  it('elección entre dos queda persistida y recoger no duplica', () => {
    let crates = createInitialCratesState()
    const roll = rollCrateForCompletion({
      completionId: 'choice-1',
      activity: 'firstMastery',
      crates,
      newlyMasteredTable: '3',
      random: () => 0.01,
    })
    // force choice state
    crates = {
      ...roll.crates,
      pending: {
        completionId: 'choice-1',
        rarity: 'normal',
        isChoice: true,
        chosenIndex: null,
        opened: false,
        options: [
          { rarity: 'normal', reward: { kind: 'energy', amount: 5 } },
          { rarity: 'especial', reward: { kind: 'energy', amount: 40 } },
        ],
        reward: { kind: 'energy', amount: 5 },
      },
    }
    crates = chooseCrateOption(crates, 1)
    expect(crates.pending?.chosenIndex).toBe(1)
    expect(crates.pending?.reward.amount).toBe(40)
    crates = markCrateOpened(crates)
    const first = collectPendingCrate(crates)
    expect(first.applied).toBe(true)
    const second = collectPendingCrate(first.crates)
    expect(second.applied).toBe(false)
  })

  it('la pareja de elección siempre tiene una mejor y con más energía', () => {
    for (let i = 0; i < 80; i += 1) {
      let n = 0
      const random = () => {
        n += 1
        return ((i * 17 + n * 31) % 97) / 97
      }
      const pair = makeChoiceCratePair(random)
      expect(pair).toHaveLength(2)
      const [a, b] = pair
      const ranks = { normal: 0, especial: 1, epica: 2 } as const
      expect(Math.abs(ranks[a!.rarity] - ranks[b!.rarity])).toBeGreaterThan(0)
      expect(Math.max(a!.reward.amount, b!.reward.amount)).toBeGreaterThan(
        Math.min(a!.reward.amount, b!.reward.amount),
      )
      const better = a!.reward.amount > b!.reward.amount ? a! : b!
      const worse = a!.reward.amount > b!.reward.amount ? b! : a!
      expect(ranks[better.rarity]).toBeGreaterThan(ranks[worse.rarity])
      expect(worse.rarity).toBe('normal')
      expect(better.rarity === 'especial' || better.rarity === 'epica').toBe(true)
    }
  })

  it('si toca elegir entre dos, las opciones no son iguales', () => {
    let crates = createInitialCratesState()
    let found = false
    for (let i = 0; i < 60; i += 1) {
      let n = 0
      const random = () => {
        n += 1
        // drop sí + choice sí + rellenos
        if (n === 1) return 0.01
        if (n === 2) return 0.01
        return ((i * 13 + n * 19) % 89) / 89
      }
      const roll = rollCrateForCompletion({
        completionId: `choice-pair-${i}`,
        activity: 'firstMastery',
        crates: createInitialCratesState(),
        newlyMasteredTable: String(2 + (i % 7)),
        random,
      })
      if (!roll.pending?.isChoice) continue
      found = true
      const [a, b] = roll.pending.options
      expect(a!.rarity).not.toBe(b!.rarity)
      expect(a!.reward.amount).not.toBe(b!.reward.amount)
      crates = roll.crates
    }
    expect(found).toBe(true)
    expect(crates.pending).toBeTruthy()
  })

  it('no reabre una caja ya recogida al fusionar con el servidor', () => {
    const server = createInitialCratesState()
    server.pending = {
      completionId: 'done-1',
      rarity: 'normal',
      isChoice: false,
      chosenIndex: 0,
      opened: true,
      options: [{ rarity: 'normal', reward: { kind: 'energy', amount: 10 } }],
      reward: { kind: 'energy', amount: 10 },
    }
    const local = createInitialCratesState()
    local.claimedCompletionIds = ['done-1']
    const merged = mergeCratesState(server, local)
    expect(merged.pending).toBeNull()
    expect(merged.claimedCompletionIds).toContain('done-1')
  })
})
