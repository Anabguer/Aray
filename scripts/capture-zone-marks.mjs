import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const out = path.resolve(__dirname, '../docs/captures')
const base = process.env.ARAY_BASE || 'http://127.0.0.1:5173/aray/'

const me = {
  authenticated: true,
  role: 'child',
  csrf: 'c',
  player: { id: 1, slug: 'aray', displayName: 'Aray' },
  players: [{ id: 1, slug: 'aray', displayName: 'Aray' }],
  device: {
    authorized: true,
    deviceId: 1,
    deviceLabel: 'c',
    player: { id: 1, slug: 'aray', displayName: 'Aray' },
  },
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
await page.addInitScript((payload) => {
  const raw = JSON.stringify(payload)
  const o = window.fetch.bind(window)
  window.fetch = async (i) => {
    const u = typeof i === 'string' ? i : i.url
    if (u.includes('/api/v1/')) {
      return new Response(raw, { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    return o(i)
  }
}, me)

await page.goto(`${base}missions/mates`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForSelector('.zone-mark__art', { timeout: 20000 })
await page.waitForTimeout(700)

const marks = await page.evaluate(() =>
  [...document.querySelectorAll('.zone-mark')].map((el) => {
    const r = el.getBoundingClientRect()
    const img = el.querySelector('.zone-mark__art')
    return {
      cls: el.className,
      w: Math.round(r.width),
      h: Math.round(r.height),
      hasArt: Boolean(img),
      src: img?.getAttribute('src')?.split('/').pop(),
    }
  }),
)
console.log(JSON.stringify(marks, null, 2))

const els = await page.locator('.zone-mark').all()
for (let i = 0; i < els.length; i += 1) {
  await els[i].screenshot({ path: path.join(out, `zone-mark-close-${i}.png`) })
}

await page.screenshot({ path: path.join(out, 'maths-map-zones-art-1366.png'), fullPage: false })
await page.setViewportSize({ width: 390, height: 844 })
await page.waitForTimeout(700)
await page.screenshot({ path: path.join(out, 'maths-map-zones-art-390.png'), fullPage: false })
await browser.close()
console.log('ok')
