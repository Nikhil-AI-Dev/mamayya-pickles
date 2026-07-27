/* Mamayya Pickles service worker.
   Deliberately minimal: caches ONLY the offline fallback page. All real
   traffic stays network-first with zero caching here, so a deploy is
   always picked up immediately and nothing can go stale. */
const CACHE = "mamayya-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(OFFLINE_URL).then(
        (cached) =>
          cached ||
          new Response("You are offline.", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          })
      )
    )
  );
});
