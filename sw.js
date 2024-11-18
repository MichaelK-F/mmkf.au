self.addEventListener('fetch', event => { 
  if (event.request.method != 'GET') return;
  event.respondWith(async function() {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    // If no cached version, fall back to server fetch
    return cached ? cached : fetch(event.request);
  })
});
