import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../docs/captures')
const base = 'http://127.0.0.1:4173/aray/'

fs.mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true, channel: 'chrome' })

const jobs = [
  { name: 'missions-rhythm-1366x768.png', w: 1366, h: 768 },
  { name: 'missions-rhythm-1440x900.png', w: 1440, h: 900 },
  { name: 'missions-rhythm-1920x1080.png', w: 1920, h: 1080 },
]

for (const job of jobs) {
  const page = await browser.newPage({ viewport: { width: job.w, height: job.h } })
  await page.goto(`${base}missions`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.world-map__grid')
  await page.waitForTimeout(500)
  const metrics = await page.evaluate(() => {
    const main = document.querySelector('.app-main')
    const header = document.querySelector('.game-header')
    const map = document.querySelector('.world-map')
    const hr = header.getBoundingClientRect()
    const mr = map.getBoundingClientRect()
    const hs = getComputedStyle(header)
    return {
      headerTop: Math.round(hr.top),
      headerMarginTop: hs.marginTop,
      gap: Math.round(mr.top - hr.bottom),
      mapTop: Math.round(mr.top),
      mapBottom: Math.round(mr.bottom),
      viewport: window.innerHeight,
      spaceBelow: Math.round(window.innerHeight - mr.bottom),
      mainPadTop: getComputedStyle(main).paddingTop,
    }
  })
  console.log(job.w + 'x' + job.h, JSON.stringify(metrics))
  await page.screenshot({ path: path.join(outDir, job.name), fullPage: false })
  console.log('saved', job.name)
  await page.close()
}

await browser.close()
