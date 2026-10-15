const CACHE_NAME = "kids-timer-v4"
const PRECACHE = ["/", "/manifest.json", "/icon.svg", "/icon-192.png", "/icon-512.png", "/icon-maskable-512.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)))
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))),
  )
  self.clients.claim()
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME)
    await cache.put(request, response.clone())
  }
  return response
}

async function networkFirst(event) {
  const { request } = event
  try {
    const response = await fetch(request)
    if (response.ok) {
      const copy = response.clone()
      event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)))
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    if (request.mode === "navigate") {
      const shell = await caches.match("/")
      if (shell) return shell
    }
    return Response.error()
  }
}

// Hashed build assets are immutable, so they are served cache-first; everything
// else same-origin is network-first with the cached shell as the offline fallback.
self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request))
    return
  }
  event.respondWith(networkFirst(event))
})
