const CACHE_NAME = 'event-horizon-cache-v1';
const IMAGE_CACHE = 'event-horizon-images-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Optionally pre-cache static shell assets if needed
      return cache.addAll(['/index.html']);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(k => k !== CACHE_NAME && k !== IMAGE_CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Cache-first strategy for images
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Apply caching for requests under /objects/ (uploads) and common image extensions
  if (url.pathname.startsWith('/objects/') || /\.(png|jpg|jpeg|gif|webp|avif|svg)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const resp = await fetch(event.request);
          if (resp && resp.status === 200) {
            cache.put(event.request, resp.clone());
          }
          return resp;
        } catch (err) {
          // If offline and no cache, return a small transparent response or fallback image
          const fallback = '/offline-image.png';
          const fallbackResp = await caches.match(fallback);
          if (fallbackResp) return fallbackResp;
          return new Response('', { status: 503, statusText: 'Service Unavailable' });
        }
      })
    );
  }

  // Default: bypass
});
