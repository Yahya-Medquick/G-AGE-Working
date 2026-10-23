const CACHE_NAME = 'gage-ai-v3';
const OFFLINE_URL = '/offline.html';
const PRECACHE_ASSETS = ['/', '/offline.html', '/manifest.json', '/icons/icon-192x192.png', '/icons/icon-512x512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  const offlineResponse = () => caches.match(event.request)
    .then((cached) => cached || caches.match(OFFLINE_URL))
    .then((response) => response || new Response('Offline', { status: 503 }))
    .catch(() => new Response('Offline', { status: 503 }));

  const cacheResponse = (response) => {
    if (response.status === 200) {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
    }
    return response;
  };

  const requestUrl = new URL(event.request.url);
  if (requestUrl.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request)
        .then((cached) => cached || fetch(event.request).then(cacheResponse))
        .catch(offlineResponse)
    );
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then(cacheResponse)
      .catch(offlineResponse)
  );
});
