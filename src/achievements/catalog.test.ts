import { describe, expect, it } from 'vitest'
import { achievementCatalog } from '@/achievements/catalog'

describe('achievementCatalog images', () => {
  it('usa una imagen distinta por cada logro', () => {
    const byImage = new Map<string, string[]>()
    for (const item of achievementCatalog) {
      const ids = byImage.get(item.image) ?? []
      ids.push(item.id)
      byImage.set(item.image, ids)
    }
    const duplicates = [...byImage.entries()].filter(([, ids]) => ids.length > 1)
    expect(duplicates, JSON.stringify(duplicates)).toEqual([])
  })
})
