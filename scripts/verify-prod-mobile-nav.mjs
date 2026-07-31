import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const base = 'https://intocables13.com/aray/afkacademy'
const outDir = resolve('docs/captures')
mkdirSync(outDir, { recursive: true })
const results = {}

const homeRes = await fetch(`${base}/`)
const html = await homeRes.text()
results.htmlStatus = homeRes.status
const jsMatch = html.match(/assets\/(index-[^"']+\.js)/)
const cssMatch = html.match(/assets\/(index-[^"']+\.css)/)
results.js = jsMatch?.[1] ?? null
results.css = cssMatch?.[1] ?? null

if (results.js) {
  const js = await fetch(`${base}/assets/${results.js}`).then((r) => r.text())
  results.bundle = {
    file: results.js,
    hasMODO: js.includes('MODO'),
    hasEligeTuModo: /Elige tu modo/i.test(js),
    hasMezclaTablas: /Mezcla tablas del 2 al 9/i.test(js),
    hasLevelsLaunch: js.includes('levels-launch__play'),
    hasScrollRestoration: js.includes('scrollRestoration'),
    hasFarmear: /Farmear energ/i.test(js),
    hasWorldSceneAvailable: js.includes('world-scene--available'),
  }
}

if (results.css) {
  const css = await fetch(`${base}/assets/${results.css}`).then((r) => r.text())
  results.cssChecks = {
    file: results.css,
    hasLevelsLaunchPlay: css.includes('.levels-launch__play'),
    modePostersTwoCol: css.includes('grid-template-columns:repeat(2') || css.includes('grid-template-columns: repeat(2'),
  }
}

results.health = await fetch(`${base}/api/v1/health.php`)
  .then(async (r) => ({ status: r.status, body: (await r.text()).slice(0, 200) }))
  .catch((e) => ({ error: String(e) }))

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
await page.goto(`${base}/`, { waitUntil: 'networkidle', timeout: 45000 })
await page.waitForTimeout(700)
results.homeUrl = page.url()
results.homeTitle = await page.title()
results.bodySnippet = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 320)
results.hasAuthUi = /autorizar|PIN|dispositivo|entrar/i.test(results.bodySnippet)

async function probe(path, key) {
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => null)
  await page.waitForTimeout(500)
  results[key] = await page.evaluate(() => {
    const short = document.querySelector('.game-header__title-short')
    const full = document.querySelector('.game-header__title-full')
    const shortVisible = Boolean(short && getComputedStyle(short).display !== 'none')
    const posters = document.querySelector('.mode-posters')
    const play = document.querySelector('.levels-launch__play')
    const world = document.querySelector('a.world-scene--available')
    return {
      url: location.pathname + location.search,
      scrollY: window.scrollY,
      hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      title: (shortVisible ? short : full)?.textContent?.trim() || document.querySelector('.game-header__title')?.textContent?.trim() || null,
      mixPresent: document.body.innerText.includes('Mezcla tablas del 2 al 9'),
      playText: play?.textContent?.replace(/\s+/g, ' ').trim() || null,
      playPresent: Boolean(play),
      modeCols: posters ? getComputedStyle(posters).gridTemplateColumns : null,
      modeCount: document.querySelectorAll('.mode-poster').length,
      worldIsFullLink: Boolean(world),
      worldHref: world?.getAttribute('href') || null,
    }
  })
  await page.screenshot({ path: resolve(outDir, `prod-check-${key}-390.png`), fullPage: true })
}

await probe('/missions', 'missions')
await probe('/missions/mates/tables', 'tables')
await probe('/missions/mates/tables/modes', 'modes')
await browser.close()

console.log(JSON.stringify(results, null, 2))
