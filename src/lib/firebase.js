import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Configuración centralizada de Firebase (usa variables de entorno de Vercel/Vite).
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: 'libreria-interactiva.firebaseapp.com',
    projectId: 'libreria-interactiva',
    storageBucket: 'libreria-interactiva.firebasestorage.app',
    messagingSenderId: '663772506106',
    appId: '1:663772506106:web:98db55443a6db7f5852643',
    measurementId: 'G-0C50QQ119H'
};

// Evita inicializar Firebase más de una vez.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Exporta la instancia de Auth lista para usarse en la app.
const auth = getAuth(app);

export { app, auth };
