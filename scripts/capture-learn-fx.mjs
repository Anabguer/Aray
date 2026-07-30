import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../docs/captures')
const base = 'http://127.0.0.1:4173/aray/'
fs.mkdirSync(outDir, { recursive: true })

async function goLearn(page) {
  await page.goto(`${base}missions/mates/tables/learn`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.learn-lab .answer-btn', { timeout: 15000 })
  await page.waitForTimeout(300)
}

async function clickAndWaitFx(page, index) {
  await page.locator('.learn-lab .answer-btn').nth(index).click()
  await page
    .locator('.learn-lab__bubble, .learn-lab__near, .learn-lab__stamp, .learn-lab__band, .answer-btn.is-correct, .answer-btn.is-wrong')
    .first()
    .waitFor({ timeout: 2000 })
  await page.waitForTimeout(180)
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' })

{
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } })
  await goLearn(page)
  await page.screenshot({ path: path.join(outDir, 'learn-fx-1-initial.png'), fullPage: false })
  await page.close()
}

// Try several answers to catch hit + miss variants
{
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } })
  await goLearn(page)
  // Wrong-ish: try option that isn't 7 for 7x1 - options vary; click all until wrong then correct
  for (let i = 0; i < 4; i++) {
    const phase = await page.locator('.learn-lab__console').getAttribute('class')
    if (phase?.includes('is-hit')) break
    await clickAndWaitFx(page, i)
    const hasFx = await page.locator('.learn-lab__bubble, .learn-lab__near, .learn-lab__stamp, .learn-lab__band').count()
    const wrong = await page.locator('.answer-btn.is-wrong').count()
    const correct = await page.locator('.answer-btn.is-correct').count()
    if (wrong) {
      await page.screenshot({ path: path.join(outDir, 'learn-fx-4-miss.png') })
      console.log('miss fx', hasFx, 'kind check')
      await page.waitForTimeout(700)
    }
    if (correct) {
      await page.screenshot({ path: path.join(outDir, 'learn-fx-2-hit.png') })
      // also try to label by fx kind
      const bubble = await page.locator('.learn-lab__bubble').count()
      const near = await page.locator('.learn-lab__near').count()
      const stamp = await page.locator('.learn-lab__stamp').count()
      const band = await page.locator('.learn-lab__band').count()
      if (near) await page.screenshot({ path: path.join(outDir, 'learn-fx-2-near.png') })
      if (bubble) await page.screenshot({ path: path.join(outDir, 'learn-fx-3-bubble.png') })
      if (stamp) await page.screenshot({ path: path.join(outDir, 'learn-fx-3-stamp.png') })
      if (band) await page.screenshot({ path: path.join(outDir, 'learn-fx-3-band.png') })
      console.log({ bubble, near, stamp, band })
      break
    }
  }
  await page.close()
}

// Extra runs to collect bubble + near specifically
for (const label of ['extra-a', 'extra-b', 'extra-c', 'extra-d']) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } })
  await goLearn(page)
  // find correct by reading product
  const fact = await page.locator('.learn-lab__fact').innerText()
  const m = fact.match(/(\d+)\s*[×x]\s*(\d+)/i)
  const product = m ? Number(m[1]) * Number(m[2]) : null
  const values = await page.locator('.learn-lab .answer-btn__value').allTextContents()
  const wrongIdx = values.findIndex((v) => Number(v) !== product)
  const rightIdx = values.findIndex((v) => Number(v) === product)
  if (wrongIdx >= 0) {
    await clickAndWaitFx(page, wrongIdx)
    await page.screenshot({ path: path.join(outDir, `learn-fx-miss-${label}.png`) })
    await page.waitForTimeout(650)
  }
  if (rightIdx >= 0) {
    await clickAndWaitFx(page, rightIdx)
    const bubble = await page.locator('.learn-lab__bubble').count()
    const near = await page.locator('.learn-lab__near').count()
    if (near && !fs.existsSync(path.join(outDir, 'learn-fx-2-near.png'))) {
      await page.screenshot({ path: path.join(outDir, 'learn-fx-2-near.png') })
    }
    if (bubble && !fs.existsSync(path.join(outDir, 'learn-fx-3-bubble.png'))) {
      await page.screenshot({ path: path.join(outDir, 'learn-fx-3-bubble.png') })
    }
    await page.screenshot({ path: path.join(outDir, `learn-fx-hit-${label}.png`) })
  }
  await page.close()
}

{
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } })
  await goLearn(page)
  await page.locator('.learn-lab__nav').screenshot({ path: path.join(outDir, 'learn-fx-5-nav.png') })
  await page.close()
}

{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await goLearn(page)
  await page.screenshot({ path: path.join(outDir, 'learn-fx-6-mobile-390.png') })
  await page.close()
}

await browser.close()
console.log('captures ok')
