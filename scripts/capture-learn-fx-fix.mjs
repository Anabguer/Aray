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
  await page.waitForTimeout(250)
}

async function productOf(page) {
  const fact = await page.locator('.learn-lab__fact').innerText()
  const m = fact.match(/(\d+)\s*[×x]\s*(\d+)/i)
  return m ? Number(m[1]) * Number(m[2]) : null
}

async function clickValue(page, value) {
  const values = await page.locator('.learn-lab .answer-btn__value').allTextContents()
  const idx = values.findIndex((v) => Number(v) === value)
  if (idx < 0) return false
  await page.locator('.learn-lab .answer-btn').nth(idx).click()
  return true
}

async function clickWrong(page, product) {
  const values = await page.locator('.learn-lab .answer-btn__value').allTextContents()
  const idx = values.findIndex((v) => Number(v) !== product)
  if (idx < 0) return false
  await page.locator('.learn-lab .answer-btn').nth(idx).click()
  return true
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' })

// Bubble desktop: retry until bubble appears on hit
{
  let got = false
  for (let attempt = 0; attempt < 12 && !got; attempt++) {
    const page = await browser.newPage({ viewport: { width: 1100, height: 900 } })
    await goLearn(page)
    const product = await productOf(page)
    await clickValue(page, product)
    await page.waitForTimeout(220)
    if ((await page.locator('.learn-lab__bubble').count()) > 0) {
      await page.screenshot({ path: path.join(outDir, 'learn-fx-fix-bubble.png') })
      got = true
      console.log('bubble ok')
    }
    await page.close()
  }
}

// Near corrected
{
  let got = false
  for (let attempt = 0; attempt < 12 && !got; attempt++) {
    const page = await browser.newPage({ viewport: { width: 1100, height: 900 } })
    await goLearn(page)
    const product = await productOf(page)
    await clickValue(page, product)
    await page.waitForTimeout(220)
    if ((await page.locator('.answer-btn__near').count()) > 0) {
      await page.screenshot({ path: path.join(outDir, 'learn-fx-fix-near.png') })
      got = true
      console.log('near ok')
    }
    await page.close()
  }
}

// Combo ×2+: two first-try hits, capture when combo visible
{
  let got = false
  for (let attempt = 0; attempt < 10 && !got; attempt++) {
    const page = await browser.newPage({ viewport: { width: 1100, height: 900 } })
    await goLearn(page)
    for (let q = 0; q < 2; q++) {
      const product = await productOf(page)
      await clickValue(page, product)
      await page.waitForTimeout(q === 0 ? 1000 : 280)
    }
    const note = await page.locator('.learn-lab__bar-note').innerText()
    const comboFx = await page
      .locator(
        '.learn-lab__bubble-combo, .learn-lab__stamp-label, .learn-lab__band-msg, .answer-btn__near-combo',
      )
      .allTextContents()
    const hasCombo = /combo\s*×\s*[2-9]/i.test(note) || comboFx.some((t) => /combo\s*×\s*[2-9]/i.test(t))
    if (hasCombo) {
      await page.screenshot({ path: path.join(outDir, 'learn-fx-fix-combo.png') })
      got = true
      console.log('combo ok', note, comboFx)
    }
    await page.close()
  }
}

// Miss mobile 390
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await goLearn(page)
  const product = await productOf(page)
  await clickWrong(page, product)
  await page.waitForTimeout(280)
  await page.screenshot({ path: path.join(outDir, 'learn-fx-fix-miss-390.png') })
  console.log('miss mobile ok')
  await page.close()
}

await browser.close()
console.log('done')
