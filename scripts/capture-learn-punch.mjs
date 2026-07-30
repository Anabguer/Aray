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
    sessionStorage.setItem('aray.tables.selection', JSON.stringify({ tables: [2], mix: false }))
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

async function openLearn(page) {
  await page.goto(`${base}missions/mates/tables/learn`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  })
  await page.waitForSelector('.learn-lab', { timeout: 25000 })
  await page.waitForTimeout(700)
}

async function productOfPrompt(page) {
  const text = (await page.locator('.learn-lab__fact').innerText()).replace(/\s+/g, ' ')
  const m = text.match(/(\d+)\s*[×x]\s*(\d+)/i)
  if (!m) throw new Error(`No fact: ${text}`)
  return Number(m[1]) * Number(m[2])
}

async function clickValue(page, value) {
  const btn = page
    .locator('.answer-btn')
    .filter({ has: page.locator('.answer-btn__value', { hasText: String(value) }) })
  await btn.first().click({ timeout: 10000 })
}

async function clickWrong(page) {
  const product = await productOfPrompt(page)
  const buttons = page.locator('.answer-btn')
  const count = await buttons.count()
  for (let i = 0; i < count; i++) {
    const t = Number((await buttons.nth(i).locator('.answer-btn__value').innerText()).trim())
    if (t !== product) {
      await buttons.nth(i).click()
      return
    }
  }
  throw new Error('No wrong option')
}

async function shot(page, name) {
  const file = path.join(outDir, name)
  await page.screenshot({ path: file, fullPage: true })
  console.log('saved', file)
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' })

// Desktop: initial
{
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } })
  await prep(page)
  await openLearn(page)
  await shot(page, 'learn-punch-initial.png')
  await page.close()
}

// Desktop: wrong
{
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } })
  await prep(page)
  await openLearn(page)
  await clickWrong(page)
  await page.waitForTimeout(280)
  await shot(page, 'learn-punch-wrong.png')
  await page.close()
}

// Desktop: correct
{
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } })
  await prep(page)
  await openLearn(page)
  const product = await productOfPrompt(page)
  await clickValue(page, product)
  await page.waitForTimeout(320)
  await shot(page, 'learn-punch-correct.png')
  await page.close()
}

// Desktop: 10/10 done
{
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } })
  await prep(page)
  await openLearn(page)
  for (let i = 0; i < 10; i++) {
    await page.waitForSelector('.answer-btn', { timeout: 10000 })
    const product = await productOfPrompt(page)
    await clickValue(page, product)
    if (i < 9) {
      await page.waitForTimeout(1200)
    } else {
      await page.waitForSelector('.learn-lab__done', { timeout: 8000 })
      await page.waitForTimeout(500)
    }
  }
  await shot(page, 'learn-punch-perfect.png')
  await page.close()
}

// Mobile 390
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await prep(page)
  await openLearn(page)
  await shot(page, 'learn-punch-mobile-390.png')
  await page.close()
}

await browser.close()
console.log('done')
