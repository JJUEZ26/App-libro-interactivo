import { initApp } from './app/init.js';
import './components/chroma-video.js';

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

// =============================================
// SERVICE WORKER — Activa la funcionalidad PWA
// (caché offline, instalación como app, etc.)
// Se registra DESPUÉS del load para no competir
// con la carga inicial de la página.
// =============================================
if ('serviceWorker' in navigator && !isLocalhost && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => {
                console.log('Service Worker registrado:', reg.scope);
            })
            .catch(err => {
                console.warn('Service Worker no se pudo registrar:', err);
            });
    });
} else if ('serviceWorker' in navigator && isLocalhost) {
    window.addEventListener('load', async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName.startsWith('lecturas-interactivas-cache'))
                    .map((cacheName) => caches.delete(cacheName))
            );
        }
    });
}
