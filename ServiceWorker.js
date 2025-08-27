// Cache versioning
const CACHE_NAME = "mmkf-v2";

// Resources to precache at install (ALL site files)
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/README.md",
  "/sitemap.txt",
  "/favicon.png",
  "/css/main.css",
  "/css/bootstrap.5.3.7.min.css",
  "/imgs/linkedin.svg",
  "/imgs/github-mark-white.svg",
  "/favicon/apple-touch-icon.png",
  "/favicon/favicon-96x96.png",
  "/favicon/favicon.svg",
  "/favicon/favicon.ico",
  "/favicon/site.webmanifest",
  "/favicon/web-app-manifest-192x192.png",
  "/favicon/web-app-manifest-512x512.png",
  "/qr/bc/index.html",
  "/ServiceWorker.js",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS);
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Enable navigation preload when available
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }

      // Clean up old caches
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));

      await self.clients.claim();
    })()
  );
});

// Helper: cache-first for same-origin assets, with network fallback
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // ignore non-GET

  // Handle navigations: try preload/network, fall back to cached shell
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          // Use the preloaded response if it's there
          const preload = await event.preloadResponse;
          if (preload) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, preload.clone());
            return preload;
          }

          // Else go to network
          const networkResponse = await fetch(event.request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        } catch (e) {
          // Offline fallback to cached page shell
          const cache = await caches.open(CACHE_NAME);
          const cached =
            (await cache.match(event.request)) ||
            (await cache.match("/index.html")) ||
            (await cache.match("/"));
          return (
            cached || new Response("Offline: page not available in cache.", { status: 503 })
          );
        }
      })()
    );
    return;
  }

  // Same-origin assets: cache-first
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Cross-origin: network-first, fall back to cache if present
  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch {
        const cached = await caches.match(request);
        return cached || new Response("Offline: external resource not cached.", { status: 504 });
      }
    })()
  );
});
