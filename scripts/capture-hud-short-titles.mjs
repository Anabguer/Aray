import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../docs/captures')
const base = 'http://127.0.0.1:4173/aray/'

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

async function measure(page, route, w, h) {
  await page.setViewportSize({ width: w, height: h })
  await page.goto(`${base}${route.replace(/^\//, '')}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  })
  await page.waitForSelector('.game-header__title', { timeout: 25000 })
  await page.waitForTimeout(400)
  return page.evaluate(() => {
    const header = document.querySelector('.game-header')
    const title = document.querySelector('.game-header__title')
    const full = document.querySelector('.game-header__title-full')
    const short = document.querySelector('.game-header__title-short')
    const coins = document.querySelector('.game-header__coins')
    const actions = document.querySelector('.game-header__actions')
    const identity = document.querySelector('.game-header__identity')
    const boxes = [identity, coins, actions]
      .filter(Boolean)
      .map((el) => el.getBoundingClientRect())
    let overlap = false
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]
        const b = boxes[j]
        if (a.right > b.left + 1 && a.left < b.right - 1 && a.bottom > b.top + 1 && a.top < b.bottom - 1) {
          overlap = true
        }
      }
    }
    const cs = (el) => (el ? getComputedStyle(el) : null)
    return {
      visibleText: title?.textContent?.replace(/\s+/g, ' ').trim(),
      fullDisplay: cs(full)?.display,
      shortDisplay: short ? cs(short)?.display : null,
      shortText: short?.textContent?.trim() ?? null,
      identityFlex: cs(identity)?.flex,
      headingFlex: cs(document.querySelector('.game-header__heading'))?.flex,
      coinsShrink: cs(coins)?.flexShrink,
      actionsShrink: cs(actions)?.flexShrink,
      overlap,
      headerWidth: header?.getBoundingClientRect().width,
    }
  })
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const page = await browser.newPage()
await prep(page)

const jobs = [
  { route: '/missions/mates', w: 1366, h: 900, label: 'mates-desktop' },
  { route: '/missions/mates', w: 390, h: 844, label: 'mates-390' },
  { route: '/missions/mates', w: 375, h: 812, label: 'mates-375' },
  { route: '/missions/mates', w: 360, h: 740, label: 'mates-360' },
  { route: '/missions/mates', w: 320, h: 568, label: 'mates-320' },
  { route: '/missions/castellano', w: 390, h: 844, label: 'caste-390' },
  { route: '/missions/catala', w: 390, h: 844, label: 'catala-390' },
  { route: '/missions/angles', w: 390, h: 844, label: 'english-390' },
  { route: '/missions/medi', w: 390, h: 844, label: 'medi-390' },
]

for (const job of jobs) {
  const m = await measure(page, job.route, job.w, job.h)
  console.log(job.label, JSON.stringify(m))
  await page.screenshot({
    path: path.join(outDir, `hud-short-${job.label}.png`),
    clip: { x: 0, y: 0, width: job.w, height: Math.min(220, job.h) },
  })
}

await browser.close()
console.log('done')
