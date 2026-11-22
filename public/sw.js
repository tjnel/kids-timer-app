const CACHE_NAME = "kids-timer-v5"
// Hashed build files get their own cache so old builds can be trimmed without
// ever touching the app shell.
const STATIC_CACHE_NAME = "kids-timer-static-v5"
const STATIC_CACHE_LIMIT = 60

const SPRITES = [
  "/sprites/mouse-idle.png",
  "/sprites/mouse-run.png",
  "/sprites/mouse-eat.png",
  "/sprites/cheese-idle.png",
  "/sprites/cheese-eat.png",
  "/sprites/car-idle.png",
  "/sprites/car-drive.png",
  "/sprites/flag-wave.png",
]
const PRECACHE = [
  "/",
  "/about",
  "/manifest.json",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  ...SPRITES,
]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)))
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  const current = new Set([CACHE_NAME, STATIC_CACHE_NAME])
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => !current.has(name)).map((name) => caches.delete(name)))),
  )
  self.clients.claim()
})

/** Drops the oldest entries once a cache holds more than `limit`. */
async function trim(cache, limit) {
  const keys = await cache.keys()
  await Promise.all(keys.slice(0, Math.max(0, keys.length - limit)).map((key) => cache.delete(key)))
}

async function cacheFirst(event) {
  const { request } = event
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const copy = response.clone()
    event.waitUntil(
      caches.open(STATIC_CACHE_NAME).then(async (cache) => {
        await cache.put(request, copy)
        await trim(cache, STATIC_CACHE_LIMIT)
      }),
    )
  }
  return response
}

/** Answers from the cache at once and refreshes the copy in the background. */
async function staleWhileRevalidate(event) {
  const { request } = event
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  const refreshed = fetch(request).then(async (response) => {
    if (response.ok) await cache.put(request, response.clone())
    return response
  })
  if (!cached) return refreshed
  event.waitUntil(refreshed.catch(() => undefined))
  return cached
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

// Hashed build assets never change, so they are served cache-first. Sprite
// sheets keep their names when the art changes, so they are served from the
// cache and refreshed behind the scenes. Everything else same-origin is
// network-first, with the cached shell as the offline fallback.
self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(event))
    return
  }
  if (url.pathname.startsWith("/sprites/")) {
    event.respondWith(staleWhileRevalidate(event))
    return
  }
  event.respondWith(networkFirst(event))
})
