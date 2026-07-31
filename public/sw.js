/* ARAY service worker — app shell only; never caches API. */
const CACHE = 'aray-shell-v6'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(['./', './index.html', './site.webmanifest']).catch(() => undefined))
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

  // Favicons / PWA icons: always network (browsers cache them hard enough already).
  if (/\.(?:ico|png)$/i.test(url.pathname) && /favicon|icon-|apple-touch/i.test(url.pathname)) {
    event.respondWith(fetch(req))
    return
  }

  const isNavigation = req.mode === 'navigate'
  const isStatic =
    /\.(?:js|css|png|jpe?g|webp|svg|woff2?|wav|webmanifest)$/i.test(url.pathname) ||
    url.pathname.endsWith('/site.webmanifest')

  if (!isNavigation && !isStatic) return

  event.respondWith(
    (async () => {
      if (isNavigation) {
        try {
          const fresh = await fetch(req)
          const cache = await caches.open(CACHE)
          void cache.put('./index.html', fresh.clone())
          return fresh
        } catch {
          const cached = await caches.match('./index.html')
          if (cached) return cached
          throw new Error('offline')
        }
      }

      const cached = await caches.match(req)
      if (cached) {
        void fetch(req)
          .then((res) => {
            if (res.ok) {
              void caches.open(CACHE).then((c) => c.put(req, res))
            }
          })
          .catch(() => undefined)
        return cached
      }

      const fresh = await fetch(req)
      if (fresh.ok) {
        const cache = await caches.open(CACHE)
        void cache.put(req, fresh.clone())
      }
      return fresh
    })(),
  )
})
