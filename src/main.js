import { initApp } from './app/init.js';
import './components/chroma-video.js';

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// =============================================
// SERVICE WORKER — Activa la funcionalidad PWA
// (caché offline, instalación como app, etc.)
// Se registra DESPUÉS del load para no competir
// con la carga inicial de la página.
// =============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => {
                console.log('Service Worker registrado:', reg.scope);
            })
            .catch(err => {
                console.warn('Service Worker no se pudo registrar:', err);
            });
    });
}
