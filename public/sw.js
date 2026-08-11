const CACHE_NAME = 'biomed-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
];

// Install Event - Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network first with Cache Fallback for static assets and API offline fallback
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests for standard caching
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // For API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and put copy in cache
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Network failed, serve cached API response or offline JSON
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response(
              JSON.stringify({
                success: true,
                offline: true,
                message: 'Mode Hors Ligne : Données servies depuis le cache local.',
              }),
              {
                headers: { 'Content-Type': 'application/json' },
              }
            );
          });
        })
    );
    return;
  }

  // Network-first strategy for standard assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html') || caches.match('/');
          }
          return new Response('Hors Ligne', { status: 533, statusText: 'Offline' });
        });
      })
  );
});
