const CACHE_KEY = 'offline';
const CACHE_FILE_URL = 'offline.html';

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_KEY).then(
            (cache) => {
                cache.addAll([CACHE_FILE_URL]).then(() => self.skipWaiting());
            }
        ).catch(err => console.log('Some error occurred while opening cache', err))
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(
          keyList.map((key) => {
            if (key === CACHE_KEY) {
              return;
            }
            return caches.delete(key);
          }),
        );
      }),
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request.url).catch(() => caches.match(CACHE_FILE_URL))
    );
});
