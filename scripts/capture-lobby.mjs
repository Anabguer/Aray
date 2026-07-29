import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../docs/captures')
const base = 'http://127.0.0.1:4173/aray/'

async function shot(page, name, urlPath = '') {
  await page.goto(base + urlPath.replace(/^\//, ''), { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const file = path.join(outDir, name)
  await page.screenshot({ path: file, fullPage: true })
  console.log('saved', file)
}

const browser = await chromium.launch({ headless: true })

const jobs = [
  { name: 'lobby-1366x768.png', w: 1366, h: 768, path: '' },
  { name: 'lobby-1920x1080.png', w: 1920, h: 1080, path: '' },
  { name: 'lobby-mobile-390x844.png', w: 390, h: 844, path: '' },
  { name: 'missions-desktop-1366x768.png', w: 1366, h: 768, path: 'missions' },
  { name: 'subjects-desktop-1920x1080.png', w: 1920, h: 1080, path: 'missions' },
]

for (const job of jobs) {
  const page = await browser.newPage({ viewport: { width: job.w, height: job.h } })
  await shot(page, job.name, job.path)
  await page.close()
}

await browser.close()
console.log('done')
