import {
    applyActionCode,
    createUserWithEmailAndPassword,
    sendEmailVerification
} from 'firebase/auth';

import { auth } from './firebase.js';

const verificationRedirectUrl = 'https://libreria-interactiva.vercel.app/verificar-correo';

// Registra un usuario y envía un correo de verificación con URL de retorno.
export async function registerUserAndSendVerification(email, password) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user, {
        url: verificationRedirectUrl
    });
    return userCredential;
}

// Confirma la verificación de correo usando el código recibido por email.
export function confirmEmailVerification(oobCode) {
    return applyActionCode(auth, oobCode);
}
