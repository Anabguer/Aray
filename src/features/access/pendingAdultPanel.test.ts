import { describe, expect, it, beforeEach } from 'vitest'
import {
  isPendingAdultPanel,
  setPendingAdultPanel,
} from '@/features/access/pendingAdultPanel'

describe('pendingAdultPanel', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('marca y limpia el flag de panel adulto', () => {
    expect(isPendingAdultPanel()).toBe(false)
    setPendingAdultPanel(true)
    expect(isPendingAdultPanel()).toBe(true)
    setPendingAdultPanel(false)
    expect(isPendingAdultPanel()).toBe(false)
  })
})
