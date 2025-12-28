import {
    formatAuthError,
    loginUser,
    logoutUser,
    registerUser,
    subscribeToAuthChanges
} from './auth.js';

function setFeedback(feedbackEl, message, type) {
    feedbackEl.textContent = message;
    feedbackEl.classList.toggle('success', type === 'success');
    feedbackEl.classList.toggle('error', type === 'error');
}

function getTrimmedValue(inputEl) {
    return inputEl.value.trim();
}

export function initAuthUI() {
    const statusEl = document.getElementById('auth-status');
    const formEl = document.getElementById('auth-form');
    const emailInput = document.getElementById('auth-email');
    const passwordInput = document.getElementById('auth-password');
    const registerBtn = document.getElementById('auth-register');
    const loginBtn = document.getElementById('auth-login');
    const logoutBtn = document.getElementById('auth-logout');
    const feedbackEl = document.getElementById('auth-feedback');

    if (!statusEl || !formEl || !emailInput || !passwordInput || !registerBtn || !loginBtn || !logoutBtn) {
        return;
    }

    const setLoadingState = (isLoading) => {
        registerBtn.disabled = isLoading;
        loginBtn.disabled = isLoading;
        logoutBtn.disabled = isLoading;
    };

    const clearFeedback = () => setFeedback(feedbackEl, '', '');

    const updateAuthState = (user) => {
        if (user) {
            statusEl.textContent = `Sesión iniciada como ${user.email}`;
            logoutBtn.classList.remove('hidden');
            registerBtn.classList.add('hidden');
            loginBtn.classList.add('hidden');
        } else {
            statusEl.textContent = 'No has iniciado sesión.';
            logoutBtn.classList.add('hidden');
            registerBtn.classList.remove('hidden');
            loginBtn.classList.remove('hidden');
        }
    };

    registerBtn.addEventListener('click', async () => {
        clearFeedback();
        const email = getTrimmedValue(emailInput);
        const password = passwordInput.value;
        if (!email || !password) {
            setFeedback(feedbackEl, 'Completa correo y contraseña para registrarte.', 'error');
            return;
        }

        setLoadingState(true);
        try {
            await registerUser(email, password);
            setFeedback(feedbackEl, 'Registro exitoso. Ya puedes usar la aplicación.', 'success');
            formEl.reset();
        } catch (error) {
            setFeedback(feedbackEl, formatAuthError(error), 'error');
        } finally {
            setLoadingState(false);
        }
    });

    loginBtn.addEventListener('click', async () => {
        clearFeedback();
        const email = getTrimmedValue(emailInput);
        const password = passwordInput.value;
        if (!email || !password) {
            setFeedback(feedbackEl, 'Completa correo y contraseña para iniciar sesión.', 'error');
            return;
        }

        setLoadingState(true);
        try {
            await loginUser(email, password);
            setFeedback(feedbackEl, 'Sesión iniciada correctamente.', 'success');
        } catch (error) {
            setFeedback(feedbackEl, formatAuthError(error), 'error');
        } finally {
            setLoadingState(false);
        }
    });

    logoutBtn.addEventListener('click', async () => {
        clearFeedback();
        setLoadingState(true);
        try {
            await logoutUser();
            setFeedback(feedbackEl, 'Sesión cerrada.', 'success');
            formEl.reset();
        } catch (error) {
            setFeedback(feedbackEl, formatAuthError(error), 'error');
        } finally {
            setLoadingState(false);
        }
    });

    subscribeToAuthChanges(updateAuthState).catch((error) => {
        statusEl.textContent = 'No se pudo verificar la sesión.';
        setFeedback(feedbackEl, formatAuthError(error), 'error');
    });
}
