import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../docs/captures')
const base = process.env.ARAY_BASE || 'http://127.0.0.1:5173/aray/'

const mePayload = {
  authenticated: true,
  role: 'child',
  csrf: 'capture-csrf',
  player: { id: 1, slug: 'aray', displayName: 'Aray' },
  players: [{ id: 1, slug: 'aray', displayName: 'Aray' }],
  device: {
    authorized: true,
    deviceId: 1,
    deviceLabel: 'capture',
    player: { id: 1, slug: 'aray', displayName: 'Aray' },
  },
}

async function prep(page) {
  await page.addInitScript((payload) => {
    const raw = JSON.stringify(payload)
    const original = window.fetch.bind(window)
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url
      if (url.includes('/api/v1/auth/me.php') || url.includes('/api/v1/csrf.php')) {
        return new Response(raw, { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (url.includes('/api/v1/')) {
        return new Response(JSON.stringify({ ok: true, csrf: 'capture-csrf' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return original(input, init)
    }
  }, mePayload)
}

async function shot(page, name, w, h) {
  await page.setViewportSize({ width: w, height: h })
  await page.goto(`${base}missions/mates`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForSelector('.world-level-map .map-station--recommended', { timeout: 25000 })
  await page.waitForTimeout(900)
  const file = path.join(outDir, name)
  await page.screenshot({ path: file, fullPage: false })
  const metrics = await page.evaluate(() => {
    const stations = [...document.querySelectorAll('.map-station')].map((el) => {
      const r = el.getBoundingClientRect()
      return {
        title: el.querySelector('.map-station__title')?.textContent?.trim(),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        fully: r.top >= 0 && r.bottom <= window.innerHeight,
        partial: r.top < window.innerHeight && r.bottom > 0,
      }
    })
    const pathLen = document.querySelector('.world-level-map__path-line')?.getAttribute('d')?.length ?? 0
    return {
      mapW: Math.round(document.querySelector('.world-level-map')?.getBoundingClientRect().width ?? 0),
      pathLen,
      stations,
    }
  })
  console.log(name, JSON.stringify(metrics))
  console.log('saved', file)
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const page = await browser.newPage()
await prep(page)
await shot(page, 'maths-map-run-1366.png', 1366, 768)
await shot(page, 'maths-map-run-390.png', 390, 844)
await browser.close()
console.log('done')
