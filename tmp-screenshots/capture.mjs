import { chromium } from 'playwright'

const outDir = 'W:/Aray/tmp-screenshots'
const base = 'http://127.0.0.1:4173/aray'

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
]

const browser = await chromium.launch({
  headless: true,
  channel: 'chrome',
})
for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
  await page.goto(`${base}/`, { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    sessionStorage.setItem('aray.tables.selection', JSON.stringify({ tables: [3], mix: false }))
  })
  await page.goto(`${base}/missions/mates/tables/match`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.match-screen', { timeout: 10000 })
  await page.waitForTimeout(600)
  await page.screenshot({
    path: `${outDir}/empareja-${vp.name}.png`,
    fullPage: true,
  })
  await page.close()
  console.log(`saved empareja-${vp.name}.png`)
}
await browser.close()
