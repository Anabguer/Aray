/* ARAY service worker — shell offline mínimo; no cachea JS/CSS (hashes + HTTP). */
const CACHE = 'aray-shell-v7'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(['./', './index.html']).catch(() => undefined))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => (k === CACHE ? Promise.resolve(false) : caches.delete(k)))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.includes('/api/')) return

  // SW y HTML: siempre red (evita quedar pegados a un deploy viejo).
  const isShellDoc =
    req.mode === 'navigate' ||
    url.pathname.endsWith('/sw.js') ||
    /\/index\.html$/i.test(url.pathname) ||
    url.pathname.endsWith('/aray/afkacademy/') ||
    url.pathname.endsWith('/aray/afkacademy')

  if (isShellDoc) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req, { cache: 'no-store' })
          if (req.mode === 'navigate' && fresh.ok) {
            const cache = await caches.open(CACHE)
            void cache.put('./index.html', fresh.clone())
          }
          return fresh
        } catch {
          const cached = await caches.match('./index.html')
          if (cached) return cached
          throw new Error('offline')
        }
      })(),
    )
    return
  }

  // Resto (assets hasheados, sonidos…): red directa, sin Cache Storage del SW.
})
