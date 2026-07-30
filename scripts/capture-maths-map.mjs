import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../docs/captures')
mkdirSync(outDir, { recursive: true })

const base = process.env.ARAY_BASE ?? 'http://127.0.0.1:4173/aray'
const browser = await chromium.launch({ channel: 'chrome', headless: true })

for (const vp of [
  { name: 'desktop-1366', width: 1366, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'mobile-390', width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
  await page.goto(`${base}/missions/mates`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.world-level-map', { timeout: 15000 })
  await page.waitForTimeout(800)

  const info = await page.evaluate(() => {
    const root = document.querySelector('.world-level-map')
    const stage = document.querySelector('.world-level-map__stage')
    const pathDesktop = document.querySelector('.world-level-map__path--desktop')
    const pathMobile = document.querySelector('.world-level-map__path--mobile')
    const chips = [...document.querySelectorAll('.map-scenery__chip')].map((el) => ({
      text: el.textContent,
      position: getComputedStyle(el).position,
      top: getComputedStyle(el).top,
    }))
    const mobileShown =
      getComputedStyle(document.querySelector('.world-level-map__stations--mobile')).display !== 'none'
    const nodes = [
      ...document.querySelectorAll(
        mobileShown
          ? '.world-level-map__stations--mobile .map-station'
          : '.world-level-map__stations--desktop .map-station',
      ),
    ]
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      stageHeight: stage?.getBoundingClientRect().height ?? null,
      pathDesktopDisplay: pathDesktop ? getComputedStyle(pathDesktop).display : null,
      pathDesktopHeight: pathDesktop?.getBoundingClientRect().height ?? null,
      pathMobileDisplay: pathMobile ? getComputedStyle(pathMobile).display : null,
      chips,
      seals: nodes.map((n) => n.querySelector('.map-station__seal')?.textContent?.trim()),
      titles: nodes.map((n) => n.querySelector('.map-station__title')?.textContent?.trim()),
      bodyTextHasLooseOps: /2\s*[×x]\s*8\s*\+\s*9/.test(document.body.innerText.replace(/\s+/g, '')),
      rootClass: root?.className ?? null,
    }
  })

  console.log(vp.name, JSON.stringify(info, null, 2))
  await page.screenshot({
    path: `${outDir}/maths-map-${vp.name}.png`,
    fullPage: true,
  })
  await page.close()
}

await browser.close()
