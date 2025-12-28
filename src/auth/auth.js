import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';

import { auth } from '../lib/firebase.js';

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
export function registerUser(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
}

// Inicia sesión con correo y contraseña.
export function loginUser(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

// Cierra la sesión del usuario actual.
export function logoutUser() {
    return signOut(auth);
}

// Escucha cambios de sesión para actualizar la interfaz.
export function subscribeToAuthChanges(callback) {
    return onAuthStateChanged(auth, callback);
}
