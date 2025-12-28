import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';

import { getFirebaseAuth } from './firebase.js';

const authErrorMessages = {
    'auth/email-already-in-use': 'Este correo ya está registrado. Prueba iniciar sesión.',
    'auth/invalid-email': 'El correo no tiene un formato válido.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/wrong-password': 'La contraseña es incorrecta.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
};

// Convierte códigos de error de Firebase en mensajes amigables para el usuario.
export function formatAuthError(error) {
    if (!error?.code) return 'Ocurrió un error inesperado. Intenta de nuevo.';
    return authErrorMessages[error.code] || 'No pudimos completar la operación. Intenta más tarde.';
}

// Registra un usuario nuevo con correo y contraseña.
export async function registerUser(email, password) {
    const auth = await getFirebaseAuth();
    return createUserWithEmailAndPassword(auth, email, password);
}

// Inicia sesión con correo y contraseña.
export async function loginUser(email, password) {
    const auth = await getFirebaseAuth();
    return signInWithEmailAndPassword(auth, email, password);
}

// Cierra la sesión del usuario actual.
export async function logoutUser() {
    const auth = await getFirebaseAuth();
    return signOut(auth);
}

// Escucha cambios de sesión para actualizar la interfaz.
export async function subscribeToAuthChanges(callback) {
    const auth = await getFirebaseAuth();
    return onAuthStateChanged(auth, callback);
}
