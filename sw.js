const addResourcesToCache = async (resources) => {
    const cache = await caches.open("v1");
    await cache.addAll(resources);
};

const cacheMatch = async (request, preloadResponsePromise) => {
    // Check if the user is offline
    if (!navigator.onLine) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        return new Response("Offline: Resource not found in cache!", { status: 404 });
    }

    // If online, prioritize preloadResponse or fetch from network
    try {
        const preloadResponse = await preloadResponsePromise;
        if (preloadResponse) {
            const cache = await caches.open("v1");
            await cache.put(request, preloadResponse.clone());
            return preloadResponse;
        }

        const networkResponse = await fetch(request);
        const cache = await caches.open("v1");
        await cache.put(request, networkResponse.clone());
        return networkResponse;
    } catch (err) {
        return new Response("Error fetching resource!", { status: 500 });
    }
};

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(addResourcesToCache([
        "/",
        "/index.html",
        "favicon.png"
    ]));
});

self.addEventListener("activate", (event) => {
    event.waitUntil(clients.claim().then(() => console.log("SW has claimed all the clients")));
    event.waitUntil(async () => {
        if (self.registration.navigationPreload) {
            await self.registration.navigationPreload.enable();
        }
    });
});

self.addEventListener("fetch", (event) => {
    event.respondWith(cacheMatch(event.request, event.preloadResponse));
});
