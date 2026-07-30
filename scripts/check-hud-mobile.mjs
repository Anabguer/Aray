import { chromium } from 'playwright'

const b = await chromium.launch({ headless: true, channel: 'chrome' })
for (const w of [320, 360, 375, 390]) {
  const page = await b.newPage({ viewport: { width: w, height: 844 } })
  await page.goto('http://127.0.0.1:4173/aray/missions', { waitUntil: 'networkidle' })
  const info = await page.evaluate(() => {
    const h = document.querySelector('.game-header')
    const hr = h.getBoundingClientRect()
    const check = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return { sel, missing: true }
      const r = el.getBoundingClientRect()
      return {
        sel,
        w: Math.round(r.width),
        clipped:
          r.right > hr.right + 0.5 ||
          r.left < hr.left - 0.5 ||
          r.bottom > hr.bottom + 0.5,
      }
    }
    const title = document.querySelector('.game-header__title')
    const cs = getComputedStyle(title)
    return {
      headerW: Math.round(hr.width),
      headerX: Math.round(hr.x),
      titleWS: cs.whiteSpace,
      titleFS: cs.fontSize,
      titleH: Math.round(title.getBoundingClientRect().height),
      help: !!document.querySelector('.lobby-help'),
      checks: [
        check('.game-header__identity'),
        check('.game-header__coins'),
        check('.game-header__actions'),
        check('.game-header .lobby-ctrl--lock'),
        check('.game-header__bars'),
        check('.game-header__lobby'),
      ],
    }
  })
  const clipped = info.checks.filter((v) => v.clipped).map((v) => v.sel)
  console.log(
    w,
    'hdr',
    info.headerW,
    'x',
    info.headerX,
    'titleH',
    info.titleH,
    'fs',
    info.titleFS,
    'ws',
    info.titleWS,
    'clipped',
    clipped.join(',') || 'none',
    'help',
    info.help,
  )
  await page.close()
}
await b.close()
