import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';

let firebaseApp;
let authInstance;
let analyticsInstance;
let configPromise;

// Recupera la configuración desde un endpoint seguro (Vercel Functions).
async function loadFirebaseConfig() {
    if (!configPromise) {
        configPromise = fetch('/api/firebase-config').then(async (response) => {
            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || 'No se pudo cargar la configuración de Firebase.');
            }
            return response.json();
        });
    }

    return configPromise;
}

// Inicializa la app de Firebase una sola vez con la configuración remota.
export async function getFirebaseApp() {
    if (!firebaseApp) {
        const firebaseConfig = await loadFirebaseConfig();
        firebaseApp = initializeApp(firebaseConfig);
        if (firebaseConfig.measurementId) {
            analyticsInstance = getAnalytics(firebaseApp);
        }
    }

    return firebaseApp;
}

// Entrega la instancia de Auth asociada a la app.
export async function getFirebaseAuth() {
    if (!authInstance) {
        const app = await getFirebaseApp();
        authInstance = getAuth(app);
    }

    return authInstance;
}

export async function getFirebaseAnalytics() {
    if (!analyticsInstance) {
        await getFirebaseApp();
    }
    return analyticsInstance;
}
