import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';

let firebaseApp;
let authInstance;
let analyticsInstance;
let configPromise;
let initializationPromise;

// Recupera la configuración desde un endpoint seguro (Vercel Functions).
async function loadFirebaseConfig() {
    if (!configPromise) {
        configPromise = fetch('/api/firebase-config')
            .then(async (response) => {
                if (!response.ok) {
                    const message = await response.text();
                    throw new Error(message || 'No se pudo cargar la configuración de Firebase.');
                }
                return response.json();
            })
            .catch((error) => {
                configPromise = null;
                throw error;
            });
    }

    return configPromise;
}

// Inicializa la app de Firebase y sus servicios asociados una sola vez.
export async function initializeFirebase() {
    if (firebaseApp && authInstance) {
        return { app: firebaseApp, auth: authInstance, analytics: analyticsInstance };
    }

    if (!initializationPromise) {
        initializationPromise = (async () => {
            const firebaseConfig = await loadFirebaseConfig();
            firebaseApp = initializeApp(firebaseConfig);
            authInstance = getAuth(firebaseApp);
            if (firebaseConfig.measurementId) {
                analyticsInstance = getAnalytics(firebaseApp);
            }
            return { app: firebaseApp, auth: authInstance, analytics: analyticsInstance };
        })().catch((error) => {
            initializationPromise = null;
            throw error;
        });
    }

    return initializationPromise;
}

// Inicializa la app de Firebase una sola vez con la configuración remota.
export async function getFirebaseApp() {
    if (!firebaseApp) {
        await initializeFirebase();
    }

    return firebaseApp;
}

// Entrega la instancia de Auth asociada a la app.
export async function getFirebaseAuth() {
    if (!authInstance) {
        await initializeFirebase();
    }

    return authInstance;
}

export async function getFirebaseAnalytics() {
    if (!analyticsInstance) {
        await initializeFirebase();
    }
    return analyticsInstance;
}
