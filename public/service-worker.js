const APP_VERSION = '2.1';
const BUILD_ID = '__BUILD_ID__';
const CACHE_PREFIX = 'lecturas-interactivas-cache-';
const CACHE_NAME = `${CACHE_PREFIX}v${APP_VERSION}-${BUILD_ID}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest'
];

const STATIC_ASSET_PATTERN =
  /\.(png|jpg|jpeg|gif|webp|svg|mp3|m4a|mp4|css|js|woff2?)$/i;
const HASHED_VITE_ASSET_PATTERN =
  /^\/assets\/.+-[a-zA-Z0-9_-]{6,}\.(css|js)$/i;

function isCacheableResponse(response) {
  return response?.ok && response.status === 200;
}

function cacheKeyWithoutSearch(request) {
  const url = new URL(request.url);
  url.search = '';
  url.hash = '';
  return url.toString();
}

async function fetchFresh(request) {
  return fetch(request, { cache: 'no-cache' });
}

async function networkFirst(request, { fallbackUrl = null, normalizeKey = false } = {}) {
  const cache = await caches.open(CACHE_NAME);
  const cacheKey = normalizeKey ? cacheKeyWithoutSearch(request) : request;

  try {
    const response = await fetchFresh(request);
    if (isCacheableResponse(response)) {
      await cache.put(cacheKey, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl);
      if (fallback) return fallback;
    }

    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheableResponse(response)) {
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await Promise.all(PRECACHE_URLS.map(async url => {
      const response = await fetch(url, { cache: 'reload' });
      if (!isCacheableResponse(response)) {
        throw new Error(`No se pudo precargar ${url}`);
      }
      await cache.put(url, response);
    }));

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();

    await Promise.all(
      cacheNames
        .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
        .map(name => caches.delete(name))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    request.headers.has('range')
  ) {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => new Response(
        JSON.stringify({
          error: 'Sin conexión. Intenta de nuevo cuando tengas internet.'
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      ))
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, {
        fallbackUrl: '/offline.html',
        normalizeKey: true
      })
    );
    return;
  }

  if (
    url.pathname.endsWith('.json') ||
    url.pathname === '/manifest.webmanifest'
  ) {
    event.respondWith(networkFirst(request, { normalizeKey: true }));
    return;
  }

  // Los assets generados por Vite incluyen un hash en el nombre: su URL cambia
  // cuando cambia el contenido, por lo que pueden conservarse con seguridad.
  if (HASHED_VITE_ASSET_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Portadas, audios, estilos y recursos de Sísifo mantienen rutas fijas.
  // Consultar primero la red evita mezclar un despliegue nuevo con archivos viejos.
  if (STATIC_ASSET_PATTERN.test(url.pathname)) {
    event.respondWith(networkFirst(request, { normalizeKey: true }));
    return;
  }

  event.respondWith(networkFirst(request, { normalizeKey: true }));
});
