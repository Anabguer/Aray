import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'

const BASE = 'http://127.0.0.1:4173/aray'
const OUT = 'W:/Aray/docs/screenshots/revision/fix-pass'

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
      masteryScore: 85,
      lastPracticedAt: new Date().toISOString(),
      bestRoundScore: 9,
      lastRoundScore: 6,
      consecutiveLowRounds: 1,
      everMastered: true,
    },
    '5': {
      practiced: true,
      attempts: 12,
      correct: 11,
      masteryScore: 90,
      lastPracticedAt: new Date().toISOString(),
      bestRoundScore: 10,
      lastRoundScore: 9,
      consecutiveLowRounds: 0,
      everMastered: true,
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
    pityWithoutCrate: 0,
    rolledCompletionIds: [],
    claimedCompletionIds: [],
    firstMasteryGrantedTables: [],
    pending: null,
  },
}

async function waitReady(page) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(300)
  await page.waitForFunction(() => [...document.images].every((img) => img.complete)).catch(() => {})
}

async function shot(page, name, { fullPage = false } = {}) {
  await waitReady(page)
  await page.screenshot({ path: path.join(OUT, name), fullPage })
  console.log('saved', name)
}

fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })

// PC shots
{
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  await context.addInitScript(
    ({ progress, selection }) => {
      localStorage.setItem('aray.progress.v1', JSON.stringify(progress))
      sessionStorage.setItem('aray.tables.selection', JSON.stringify(selection))
    },
    { progress: progressSeed, selection: { tables: [7], mix: false } },
  )
  const page = await context.newPage()

  await page.goto(`${BASE}/missions/mates/tables`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.level-card')
  await shot(page, 'tablas-pc-1366.png')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(250)
  await shot(page, 'tablas-pc-1366-scroll.png')

  await page.goto(`${BASE}/missions/mates/tables/modes`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.mode-card')
  await shot(page, 'modos-pc.png')

  await page.locator('.mode-card--learn').click()
  await page.waitForURL(/\/learn/)
  await page.waitForSelector('.learn-equation, .play-stage')
  await shot(page, 'aprende-pc.png')

  await page.goto(`${BASE}/missions/mates/tables/modes`, { waitUntil: 'networkidle' })
  await page.locator('.mode-card--train').click()
  await page.waitForURL(/\/train/)
  await page.waitForSelector('.fact-prompt__a')
  await shot(page, 'entrena-pc.png')

  await page.goto(`${BASE}/missions/mates/tables/modes`, { waitUntil: 'networkidle' })
  await page.locator('.mode-card--challenge').click()
  await page.waitForURL(/\/challenge/)
  await page.getByRole('button', { name: /empezar/i }).click()
  await page.waitForSelector('.fact-prompt__a', { timeout: 10000 })
  await page.waitForTimeout(350)
  await shot(page, 'reto-pc.png')

  await page.goto(`${BASE}/missions/mates/tables/modes`, { waitUntil: 'networkidle' })
  await page.locator('.mode-card--match').click()
  await page.waitForURL(/\/match/)
  await page.waitForSelector('.match-board')
  await shot(page, 'empareja-pc.png')

  await context.close()
}

// Mobile tables
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await context.addInitScript(
    ({ progress, selection }) => {
      localStorage.setItem('aray.progress.v1', JSON.stringify(progress))
      sessionStorage.setItem('aray.tables.selection', JSON.stringify(selection))
    },
    { progress: progressSeed, selection: { tables: [7], mix: false } },
  )
  const page = await context.newPage()
  await page.goto(`${BASE}/missions/mates/tables`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.level-card')
  await shot(page, 'tablas-mobile-390.png')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(250)
  await shot(page, 'tablas-mobile-390-scroll.png')
  await context.close()
}

await browser.close()
console.log('DONE')
