/* ARAY service worker — shell offline mínimo; no cachea JS/CSS/media. */
const CACHE = 'aray-shell-v17'

function canPutInCache(request, response) {
  // Cache Storage no admite 206 Partial Content (Range en audio/vídeo).
  if (!response || response.status !== 200) return false
  if (response.type === 'opaque') return false
  // `request` puede ser Request o string (p. ej. './index.html').
  if (request && typeof request === 'object' && request.headers && request.headers.has('range')) {
    return false
  }
  const vary = response.headers.get('Vary')
  if (vary && /\*/.test(vary)) return false
  return true
}

async function putSafe(cache, request, response) {
  if (!canPutInCache(request, response)) return
  try {
    await cache.put(request, response)
  } catch {
    /* ignorar: 206 u otros no cacheables */
  }
}

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

  // Peticiones Range (sonidos, etc.): siempre a red, sin tocar Cache Storage.
  if (req.headers.has('range')) return

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
          if (req.mode === 'navigate' && canPutInCache(req, fresh)) {
            const cache = await caches.open(CACHE)
            void putSafe(cache, './index.html', fresh.clone())
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
