self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('quran-kareem-v3').then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/logo.svg',
        '/mushaf-logo.jpg',
        '/favicon.jpg',
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== 'quran-kareem-v3') {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Don't cache API calls
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open('quran-kareem-v3').then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Return offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});

// Background sync for audio progress (placeholder)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-audio-progress') {
    event.waitUntil(
      // Sync logic would go here
      Promise.resolve()
    );
  }
});