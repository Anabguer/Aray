import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../docs/captures')
const base = 'http://127.0.0.1:4173/aray/'

fs.mkdirSync(outDir, { recursive: true })

async function shot(page, route, name) {
  await page.goto(`${base}${route}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.game-header', { timeout: 15000 })
  await page.waitForTimeout(900)
  const file = path.join(outDir, name)
  await page.locator('.game-header').screenshot({ path: file })
  console.log('saved', file)
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' })

const jobs = [
  { route: '', name: 'hud-lobby-desktop-1366.png', w: 1366, h: 768 },
  { route: 'missions', name: 'hud-missions-desktop-1366.png', w: 1366, h: 768 },
  { route: 'missions/mates', name: 'hud-mates-desktop-1366.png', w: 1366, h: 768 },
  { route: '', name: 'hud-lobby-mobile-390.png', w: 390, h: 844 },
  { route: 'missions', name: 'hud-missions-mobile-390.png', w: 390, h: 844 },
  { route: 'missions', name: 'hud-missions-mobile-320.png', w: 320, h: 720 },
]

for (const job of jobs) {
  const page = await browser.newPage({ viewport: { width: job.w, height: job.h } })
  await shot(page, job.route, job.name)
  await page.close()
}

await browser.close()
console.log('done')
