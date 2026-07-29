import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'

const BASE = 'http://127.0.0.1:4173/aray'
const ROOT = 'W:/Aray/docs/screenshots/revision'

const progressSeed = {
  version: 2,
  xp: 40,
  coins: 12,
  bestStreak: 3,
  bestChallengeScore: 8,
  lastPracticeAt: new Date().toISOString(),
  facts: {},
  tables: {
    '7': {
      practiced: true,
      attempts: 20,
      correct: 16,
      masteryScore: 6,
      lastPracticedAt: new Date().toISOString(),
      bestRoundScore: 8,
      lastRoundScore: 7,
      consecutiveLowRounds: 0,
      everMastered: false,
    },
  },
  soundMuted: true,
  reward: {
    pointsTotal: 45,
    dailyDate: new Date().toISOString().slice(0, 10),
    dailyPoints: 4,
    goalStatus: 'active',
    appliedSessionIds: [],
  },
  crates: {
    pityWithoutCrate: 8,
    rolledCompletionIds: [],
    claimedCompletionIds: [],
    firstMasteryGrantedTables: [],
    pending: null,
  },
}

async function waitReady(page) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(350)
  await page.waitForFunction(() => [...document.images].every((img) => img.complete)).catch(() => {})
}

async function shot(page, folder, name) {
  await waitReady(page)
  const out = path.join(ROOT, folder, name)
  await page.screenshot({ path: out, fullPage: true })
  console.log('saved', `${folder}/${name}`)
}

async function goModes(page) {
  await page.goto(`${BASE}/missions/mates/tables/modes`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.mode-card, .mode-cards')
}

async function answerOneTrain(page) {
  await page.waitForSelector('.answer-btn:not([disabled])')
  const progressBefore = await page.locator('.play-progress').innerText()
  const a = Number((await page.locator('.fact-prompt__a').innerText()).trim())
  const b = Number((await page.locator('.fact-prompt__b').innerText()).trim())
  const product = a * b
  const values = await page.locator('.answer-btn__value').allInnerTexts()
  const idx = values.findIndex((v) => Number(v.trim()) === product)
  if (idx < 0) throw new Error(`No está ${product} en opciones: ${values.join(',')}`)
  console.log(`  ${a}×${b}=${product} key=${idx + 1} opts=${values.map((v) => v.trim()).join(',')}`)
  const isLast = /Pregunta\s*10\s*\/\s*10/i.test(progressBefore)
  await page.locator('.answer-btn').nth(idx).click()
  if (isLast) {
    await page.waitForURL(/\/summary/, { timeout: 15000 })
    return
  }
  await page
    .waitForFunction(
      (prev) => {
        if (location.pathname.includes('/summary')) return true
        const el = document.querySelector('.play-progress')
        return Boolean(el && el.textContent && el.textContent !== prev)
      },
      progressBefore,
      { timeout: 5000 },
    )
    .catch(() => null)
  await page.waitForTimeout(250)
}

async function completeTrainToSummary(page) {
  await goModes(page)
  await page.locator('.mode-card--train').click()
  await page.waitForURL(/\/train/)
  await page.waitForSelector('.fact-prompt__a')
  for (let i = 0; i < 10; i++) {
    if (page.url().includes('/summary')) return
    const progress = await page.locator('.play-progress').innerText().catch(() => '')
    console.log('train step', i + 1, progress.replace(/\s+/g, ' ').trim())
    await answerOneTrain(page)
  }
  if (!page.url().includes('/summary')) {
    await page.waitForURL(/\/summary/, { timeout: 15000 })
  }
}

async function captureViewport(label, width, height) {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const context = await browser.newContext({ viewport: { width, height } })
  await context.addInitScript(
    ({ progress, selection }) => {
      localStorage.setItem('aray.progress.v1', JSON.stringify(progress))
      sessionStorage.setItem('aray.tables.selection', JSON.stringify(selection))
    },
    { progress: progressSeed, selection: { tables: [7], mix: false } },
  )

  const page = await context.newPage()
  page.on('pageerror', (err) => console.error('PAGEERROR', err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('CONSOLE', msg.text())
  })

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await shot(page, label, '01-lobby.png')

  await page.goto(`${BASE}/missions`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.subject-card')
  await shot(page, label, '02-misiones.png')

  await page.goto(`${BASE}/missions/mates/tables`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.level-card, .levels-grid, .tables-grid, button')
  await shot(page, label, '03-tablas.png')

  await goModes(page)
  await shot(page, label, '04-modos.png')

  await page.getByRole('link', { name: /aprende/i }).click()
  await page.waitForURL(/\/learn/)
  await page.waitForSelector('.fact-prompt, .learn-screen, .play-screen')
  await shot(page, label, '05-aprende.png')

  await goModes(page)
  await page.locator('.mode-card--train').click()
  await page.waitForURL(/\/train/)
  await page.waitForSelector('.fact-prompt__a')
  await shot(page, label, '06-entrena.png')

  await goModes(page)
  await page.locator('.mode-card--challenge').click()
  await page.waitForURL(/\/challenge/)
  await page.getByRole('button', { name: /empezar/i }).click()
  await page.waitForSelector('.fact-prompt__a', { timeout: 10000 })
  await page.waitForTimeout(400)
  await shot(page, label, '07-reto.png')

  await goModes(page)
  await page.locator('.mode-card--match').click()
  await page.waitForURL(/\/match/)
  await page.waitForSelector('.match-screen, .match-board')
  await shot(page, label, '08-empareja.png')

  await completeTrainToSummary(page)
  await page.waitForTimeout(1000)
  const hasCrate = (await page.locator('.crate-reveal').count()) > 0
  console.log(label, 'crate visible:', hasCrate)
  if (!hasCrate) {
    // Fuerza caja pendiente en el progreso ya cargado + recarga no vale (pierde lastResult).
    // Intentamos abrir la UI de caja inyectando el nodo vía estado persistido y navegando al lobby como respaldo visual.
    console.warn(label, 'sin caja en resumen; se captura el resumen igual')
  }
  await shot(page, label, '09-resumen-caja.png')

  await browser.close()
}

fs.mkdirSync(path.join(ROOT, 'pc'), { recursive: true })
fs.mkdirSync(path.join(ROOT, 'mobile'), { recursive: true })

await captureViewport('pc', 1366, 768)
await captureViewport('mobile', 390, 844)
console.log('DONE')
