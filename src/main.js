import { initApp } from './app/init.js';
import './components/chroma-video.js';

// =============================================
// GLOBAL ERROR HANDLING
// Evita fallos silenciosos mostrando un toast visual.
// =============================================
function showGlobalErrorToast(message) {
    let toast = document.getElementById('global-error-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'global-error-toast';
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 999999;
            background: var(--color-error, #ef4444); color: white;
            padding: 12px 20px; border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-family: var(--font-body, system-ui, sans-serif);
            font-size: 14px; max-width: 300px;
            opacity: 0; transition: opacity 0.3s ease; pointer-events: none;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = `Error: ${message}`;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 5000);
}

window.addEventListener('error', (event) => {
    console.error('Global Error Caught:', event.error || event.message);
    showGlobalErrorToast(event.message || 'Ha ocurrido un error inesperado.');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    showGlobalErrorToast(event.reason?.message || 'Error de red o servidor.');
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp, { once: true });
} else {
    initApp();
}

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
