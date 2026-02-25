const CACHE_NAME = 'lecturas-interactivas-cache-v3';

// Solo cachear recursos que sabemos que existen
const urlsToCache = [
  '/',
  '/index.html',
  '/data/books.json',
  '/data/library-sections.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Error al instalar el Service Worker:', err);
      })
  );
  // Activar inmediatamente sin esperar a que tabs anteriores se cierren
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Eliminar caches antiguas
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('Eliminando cache antigua:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Tomar control de todas las páginas abiertas inmediatamente
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Para archivos de datos JSON: Network First (siempre tener la última versión)
  if (url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Para assets estáticos: Cache First (imágenes, audio, CSS, JS)
  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|mp3|mp4|css|js|woff2?)$/i)
  ) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Para todo lo demás: Network First con fallback a cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
