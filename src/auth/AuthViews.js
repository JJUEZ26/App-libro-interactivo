/**
 * AuthViews — Renders Login and Register views.
 * Injects HTML into #auth-view container. Fully isolated module.
 * @module auth/AuthViews
 */

import { AuthService, validateEmail, validatePassword, validateName } from './AuthService.js';

/** @type {HTMLElement|null} */
let container = null;

/** @type {string} */
let currentView = 'login';

/** @type {Function|null} */
let onAuthSuccess = null;

/**
 * Initialize the auth views system
 * @param {{ container: HTMLElement, onSuccess: Function }} opts
 */
export function initAuthViews({ container: el, onSuccess }) {
    container = el;
    onAuthSuccess = onSuccess;
    renderCurrentView();
}

/**
 * Switch to a specific auth view
 * @param {'login'|'register'} view
 */
export function showAuthView(view) {
    currentView = view;
    renderCurrentView();
}

/** Get current view name */
export function getAuthView() {
    return currentView;
}

// ──────────────────────────────────────────
// View Renderers
// ──────────────────────────────────────────

function renderCurrentView() {
    if (!container) return;
    container.classList.add('auth-transitioning');

    setTimeout(() => {
        switch (currentView) {
            case 'register': renderRegister(); break;
            default: renderLogin(); break;
        }
        requestAnimationFrame(() => {
            container.classList.remove('auth-transitioning');
        });
    }, 200);
}

function renderLogin() {
    container.innerHTML = `
        <div class="auth-card">
            <div class="auth-card-header">
                <div class="auth-logo" aria-hidden="true">
                    ✨
                </div>
                <h2 class="auth-title">Bienvenido de vuelta</h2>
                <p class="auth-subtitle">Inicia sesión para continuar leyendo</p>
            </div>

            <form id="auth-login-form" class="auth-form" novalidate>
                <div class="auth-field" data-field="email">
                    <input type="email" id="auth-email" class="auth-input" placeholder=" " autocomplete="email" required />
                    <label for="auth-email" class="auth-label">Correo electrónico</label>
                    <span class="auth-field-error" aria-live="polite"></span>
                </div>
                <div class="auth-field" data-field="password">
                    <input type="password" id="auth-password" class="auth-input" placeholder=" " autocomplete="current-password" required />
                    <label for="auth-password" class="auth-label">Contraseña</label>
                    <button type="button" class="auth-password-toggle" aria-label="Mostrar contraseña" tabindex="-1">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                    <span class="auth-field-error" aria-live="polite"></span>
                </div>

                <div class="auth-extras">
                    <label class="auth-checkbox-label">
                        <input type="checkbox" id="auth-remember" class="auth-checkbox" checked />
                        <span class="auth-checkbox-custom"></span>
                        Recordarme
                    </label>
                    <button type="button" class="auth-link" disabled title="Próximamente">¿Olvidaste tu contraseña?</button>
                </div>

                <button type="submit" class="auth-submit-btn" id="auth-login-btn">
                    <span class="auth-btn-text">Entrar</span>
                    <span class="auth-btn-loader" aria-hidden="true"></span>
                </button>

                <div class="auth-error-banner" id="auth-login-error" role="alert" hidden></div>
            </form>

            <div class="auth-divider"><span>o</span></div>

            <button type="button" class="auth-skip-btn-inner" id="auth-skip-btn">
                Explorar sin cuenta →
            </button>

            <p class="auth-footer-text">
                ¿No tienes cuenta? <button type="button" class="auth-link auth-link--accent" data-goto="register">Crear una</button>
            </p>
        </div>
    `;
    bindLoginEvents();
}

function renderRegister() {
    container.innerHTML = `
        <div class="auth-card">
            <div class="auth-card-header">
                <h2 class="auth-title">Crea tu cuenta</h2>
                <p class="auth-subtitle">Únete a la comunidad de lectores</p>
            </div>

            <form id="auth-register-form" class="auth-form" novalidate>
                <div class="auth-field" data-field="name">
                    <input type="text" id="auth-name" class="auth-input" placeholder=" " autocomplete="name" required />
                    <label for="auth-name" class="auth-label">Nombre</label>
                    <span class="auth-field-error" aria-live="polite"></span>
                </div>
                <div class="auth-field" data-field="email">
                    <input type="email" id="auth-reg-email" class="auth-input" placeholder=" " autocomplete="email" required />
                    <label for="auth-reg-email" class="auth-label">Correo electrónico</label>
                    <span class="auth-field-error" aria-live="polite"></span>
                </div>
                <div class="auth-field" data-field="password">
                    <input type="password" id="auth-reg-password" class="auth-input" placeholder=" " autocomplete="new-password" required />
                    <label for="auth-reg-password" class="auth-label">Contraseña</label>
                    <button type="button" class="auth-password-toggle" aria-label="Mostrar contraseña" tabindex="-1">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                    <span class="auth-field-error" aria-live="polite"></span>
                </div>
                <div class="auth-field" data-field="confirm-password">
                    <input type="password" id="auth-reg-confirm" class="auth-input" placeholder=" " autocomplete="new-password" required />
                    <label for="auth-reg-confirm" class="auth-label">Confirmar contraseña</label>
                    <span class="auth-field-error" aria-live="polite"></span>
                </div>

                <button type="submit" class="auth-submit-btn" id="auth-register-btn">
                    <span class="auth-btn-text">Crear cuenta</span>
                    <span class="auth-btn-loader" aria-hidden="true"></span>
                </button>

                <div class="auth-error-banner" id="auth-register-error" role="alert" hidden></div>
            </form>

            <p class="auth-footer-text">
                ¿Ya tienes cuenta? <button type="button" class="auth-link auth-link--accent" data-goto="login">Iniciar sesión</button>
            </p>
        </div>
    `;
    bindRegisterEvents();
}



// ──────────────────────────────────────────
// Event Binding
// ──────────────────────────────────────────

function bindNavLinks() {
    container.querySelectorAll('[data-goto]').forEach(btn => {
        btn.addEventListener('click', () => showAuthView(btn.dataset.goto));
    });
}

function bindPasswordToggles() {
    container.querySelectorAll('.auth-password-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.parentElement.querySelector('input');
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            btn.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
        });
    });
}

function setLoading(btnId, loading) {
    const btn = container.querySelector(`#${btnId}`);
    if (!btn) return;
    btn.classList.toggle('auth-btn--loading', loading);
    btn.disabled = loading;
}

function showError(bannerId, message) {
    const el = container.querySelector(`#${bannerId}`);
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    el.classList.add('auth-banner--visible');
}

function hideError(bannerId) {
    const el = container.querySelector(`#${bannerId}`);
    if (!el) return;
    el.hidden = true;
    el.classList.remove('auth-banner--visible');
}

function setFieldError(fieldEl, message) {
    if (!fieldEl) return;
    const errorSpan = fieldEl.querySelector('.auth-field-error');
    if (errorSpan) errorSpan.textContent = message || '';
    fieldEl.classList.toggle('auth-field--error', !!message);
    fieldEl.classList.toggle('auth-field--valid', !message && fieldEl.querySelector('input')?.value?.length > 0);
}

function bindInlineValidation(inputId, validatorFn) {
    const input = container.querySelector(`#${inputId}`);
    if (!input) return;
    input.addEventListener('blur', () => {
        if (!input.value) return;
        const result = validatorFn(input.value);
        setFieldError(input.closest('.auth-field'), result.valid ? null : result.error);
    });
    input.addEventListener('input', () => {
        const field = input.closest('.auth-field');
        if (field.classList.contains('auth-field--error')) {
            const result = validatorFn(input.value);
            if (result.valid) setFieldError(field, null);
        }
    });
}

function bindLoginEvents() {
    bindNavLinks();
    bindPasswordToggles();
    bindInlineValidation('auth-email', validateEmail);

    const form = container.querySelector('#auth-login-form');
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError('auth-login-error');

        const email = container.querySelector('#auth-email')?.value;
        const password = container.querySelector('#auth-password')?.value;

        // Field validation
        const emailResult = validateEmail(email);
        setFieldError(container.querySelector('[data-field="email"]'), emailResult.valid ? null : emailResult.error);
        if (!emailResult.valid) return;

        if (!password) {
            setFieldError(container.querySelector('[data-field="password"]'), 'La contraseña es obligatoria');
            return;
        }

        setLoading('auth-login-btn', true);
        try {
            await AuthService.login({ email, password });
            if (onAuthSuccess) onAuthSuccess();
        } catch (err) {
            showError('auth-login-error', err.message);
            container.querySelector('.auth-card')?.classList.add('auth-shake');
            setTimeout(() => container.querySelector('.auth-card')?.classList.remove('auth-shake'), 500);
        } finally {
            setLoading('auth-login-btn', false);
        }
    });

    // Skip button
    const skipBtn = container.querySelector('#auth-skip-btn');
    skipBtn?.addEventListener('click', () => {
        if (onAuthSuccess) onAuthSuccess();
    });
}

function bindRegisterEvents() {
    bindNavLinks();
    bindPasswordToggles();
    bindInlineValidation('auth-name', validateName);
    bindInlineValidation('auth-reg-email', validateEmail);
    bindInlineValidation('auth-reg-password', validatePassword);

    // Confirm password validation
    const confirmInput = container.querySelector('#auth-reg-confirm');
    confirmInput?.addEventListener('blur', () => {
        if (!confirmInput.value) return;
        const pass = container.querySelector('#auth-reg-password')?.value;
        setFieldError(confirmInput.closest('.auth-field'),
            confirmInput.value !== pass ? 'Las contraseñas no coinciden' : null);
    });

    const form = container.querySelector('#auth-register-form');
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError('auth-register-error');

        const name = container.querySelector('#auth-name')?.value;
        const email = container.querySelector('#auth-reg-email')?.value;
        const password = container.querySelector('#auth-reg-password')?.value;
        const confirm = container.querySelector('#auth-reg-confirm')?.value;

        // Validate all
        const nameResult = validateName(name);
        setFieldError(container.querySelector('[data-field="name"]'), nameResult.valid ? null : nameResult.error);
        const emailResult = validateEmail(email);
        setFieldError(container.querySelector('[data-field="email"]'), emailResult.valid ? null : emailResult.error);
        const passResult = validatePassword(password);
        setFieldError(container.querySelector('[data-field="password"]'), passResult.valid ? null : passResult.error);

        if (password !== confirm) {
            setFieldError(container.querySelector('[data-field="confirm-password"]'), 'Las contraseñas no coinciden');
            return;
        } else {
            setFieldError(container.querySelector('[data-field="confirm-password"]'), null);
        }

        if (!nameResult.valid || !emailResult.valid || !passResult.valid) return;

        setLoading('auth-register-btn', true);
        try {
            await AuthService.register({ email, name, password });
            if (onAuthSuccess) onAuthSuccess();
        } catch (err) {
            showError('auth-register-error', err.message);
            container.querySelector('.auth-card')?.classList.add('auth-shake');
            setTimeout(() => container.querySelector('.auth-card')?.classList.remove('auth-shake'), 500);
        } finally {
            setLoading('auth-register-btn', false);
        }
    });
}


