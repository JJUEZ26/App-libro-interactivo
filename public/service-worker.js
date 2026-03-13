const CACHE_NAME = 'lecturas-interactivas-cache-v11';

// Recursos esenciales que se cachean al instalar
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
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

  // Ignorar requests a API endpoints (no cachear respuestas de IA)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Sin conexión. Intenta de nuevo cuando tengas internet.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

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

  // Para navegación (HTML pages): Network First con fallback a offline.html
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
      .catch(() => {
        // Si es una navegación (el usuario quiere ver una página), mostrar offline.html
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        return caches.match(event.request);
      })
  );
});

