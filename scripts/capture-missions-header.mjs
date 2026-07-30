import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../docs/captures')
const base = 'http://127.0.0.1:4173/aray/'

fs.mkdirSync(outDir, { recursive: true })

async function shot(page, name, urlPath = 'missions') {
  await page.goto(`${base}${urlPath}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.game-header', { timeout: 15000 })
  await page.waitForSelector('.world-scene--maths', { timeout: 15000 })
  await page.waitForSelector('.world-scene--medi img', { timeout: 15000 })
  await page.waitForTimeout(700)
  const file = path.join(outDir, name)
  await page.screenshot({ path: file, fullPage: true })
  console.log('saved', file)
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' })

const jobs = [
  { name: 'missions-header-desktop-1366.png', w: 1366, h: 768 },
  { name: 'missions-header-mobile-390.png', w: 390, h: 844 },
  { name: 'missions-header-mobile-360.png', w: 360, h: 740 },
  { name: 'missions-header-mobile-320.png', w: 320, h: 640 },
]

for (const job of jobs) {
  const page = await browser.newPage({ viewport: { width: job.w, height: job.h } })
  await shot(page, job.name)
  await page.close()
}

await browser.close()
console.log('done')
