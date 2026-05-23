/**
 * UserProfile — unified personal center for account, reading controls and local traces.
 * Prepared for a future backend by keeping persistence behind local facades.
 * @module auth/UserProfile
 */

import { getGallery, removeFromGallery, clearGallery } from '../components/CanvasGallery.js';
import { getLocalReadingSummary, getShelf, removeShelfBook } from '../utils/userCollections.js';
import { AuthService } from './AuthService.js';

/** @type {HTMLElement|null} */
let drawerEl = null;

/** @type {HTMLElement|null} */
let backdropEl = null;

/** @type {boolean} */
let isOpen = false;

/** @type {'home'|'gallery'|'reading'|'account'} */
let activeProfileTab = 'home';

/** @type {string|null} */
let selectedGalleryItemId = null;

let profileControls = {
    getState: () => ({
        currentTheme: 'dark',
        fontSize: 1.2,
        currentVolume: 1,
        isFullscreen: false
    }),
    onThemeChange: () => {},
    onFontSizeChange: () => {},
    onVolumeChange: () => {},
    onFullscreenToggle: () => {}
};

/**
 * Inject reading/app controls without coupling this drawer to the app orchestrator.
 * @param {Partial<typeof profileControls>} controls
 */
export function setProfileControls(controls = {}) {
    profileControls = {
        ...profileControls,
        ...controls
    };
}

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Get initials from a display name
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join('');
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    try {
        return new Date(timestamp).toLocaleDateString('es', { day: '2-digit', month: 'short' });
    } catch {
        return '';
    }
}

function formatPercent(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '0%';
    return `${Math.round(numeric * 100)}%`;
}

function getControlsState() {
    const fallback = {
        currentTheme: 'dark',
        fontSize: 1.2,
        currentVolume: 1,
        isFullscreen: false
    };

    try {
        return {
            ...fallback,
            ...(profileControls.getState?.() || {})
        };
    } catch {
        return fallback;
    }
}

function createIcon(name) {
    const icons = {
        account: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
        close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
        gallery: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
        home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
        login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>',
        logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
        maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
        minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
        plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
        reading: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
        sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="2" y1="14" x2="6" y2="14"/><line x1="10" y1="8" x2="14" y2="8"/><line x1="18" y1="16" x2="22" y2="16"/>',
        text: '<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>',
        trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>',
        user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/>'
    };

    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.user}</svg>`;
}

/**
 * Create the profile drawer DOM structure
 * @returns {HTMLElement}
 */
function createDrawer() {
    const drawer = document.createElement('aside');
    drawer.id = 'user-profile-drawer';
    drawer.className = 'profile-drawer';
    drawer.setAttribute('aria-label', 'Centro personal');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');

    const backdrop = document.createElement('div');
    backdrop.className = 'profile-drawer-backdrop';
    backdrop.addEventListener('click', closeDrawer);

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    backdropEl = backdrop;
    return drawer;
}

function renderTabs() {
    const tabs = [
        ['home', 'Resumen', 'home'],
        ['gallery', 'Huellas', 'gallery'],
        ['reading', 'Lectura', 'sliders'],
        ['account', 'Cuenta', 'account']
    ];

    return `
        <nav class="profile-tabs" aria-label="Secciones del centro personal">
            ${tabs.map(([id, label, icon]) => `
                <button type="button" class="profile-tab${activeProfileTab === id ? ' profile-tab--active' : ''}" data-profile-tab="${id}" aria-selected="${activeProfileTab === id}">
                    ${createIcon(icon)}
                    <span>${label}</span>
                </button>
            `).join('')}
        </nav>
    `;
}

function renderSavedWorks(shelf, { compact = false } = {}) {
    if (shelf.length === 0) {
        return '<div class="profile-empty-inline profile-empty-inline--quiet"><p>Aún no hay obras guardadas.</p></div>';
    }

    const items = compact ? shelf.slice(0, 3) : shelf;

    return `
        <div class="profile-shelf-list">
            ${items.map((book) => `
                <article class="profile-shelf-item">
                    <div class="profile-shelf-cover">
                        ${book.cover ? `<img src="${escapeHTML(book.cover)}" alt="" loading="lazy">` : ''}
                    </div>
                    <div class="profile-shelf-copy">
                        <strong>${escapeHTML(book.title)}</strong>
                        <span>${escapeHTML(book.author)}</span>
                    </div>
                    <button type="button" class="profile-icon-action" data-saved-remove="${escapeHTML(book.id)}" aria-label="Quitar obra guardada">
                        ${createIcon('trash')}
                    </button>
                </article>
            `).join('')}
        </div>
    `;
}

function renderOverview(summary, shelf, gallery) {
    const latestGallery = gallery.slice(0, 4);
    const latestSaved = shelf.slice(0, 3);

    return `
        <section class="profile-panel" data-panel="home">
            <div class="profile-section-block profile-section-block--spotlight">
                <div class="profile-section-heading">
                    <span class="profile-section-icon">${createIcon('gallery')}</span>
                    <h4>Galería de huellas</h4>
                </div>
                ${latestGallery.length === 0
                    ? '<p class="profile-muted">Las huellas que guardes durante la lectura aparecerán aquí.</p>'
                    : `<div class="profile-mini-gallery">
                        ${latestGallery.map((item) => `
                            <button type="button" class="profile-mini-thumb" data-gallery-preview="${escapeHTML(item.id)}" aria-label="Ver huella">
                                <img src="${escapeHTML(item.image)}" alt="">
                            </button>
                        `).join('')}
                    </div>`
                }
            </div>

            <div class="profile-section-block">
                <div class="profile-section-heading">
                    <span class="profile-section-icon">${createIcon('reading')}</span>
                    <h4>Actividad reciente</h4>
                </div>
                <div class="profile-echo-list">
                    ${latestSaved.length === 0 && latestGallery.length === 0
                        ? '<p class="profile-muted">Todavía no hay ecos guardados.</p>'
                        : ''}
                    ${latestSaved.map((book) => `
                        <div class="profile-echo-item">
                            <span class="profile-echo-kicker">Obra guardada</span>
                            <strong>${escapeHTML(book.title)}</strong>
                            <span>${escapeHTML(book.author)}</span>
                        </div>
                    `).join('')}
                    ${latestGallery.slice(0, 2).map((item) => `
                        <div class="profile-echo-item">
                            <span class="profile-echo-kicker">Huella</span>
                            <strong>${escapeHTML(item.bookTitle || 'Dibujo guardado')}</strong>
                            <span>${formatDate(item.timestamp)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="profile-section-block">
                <div class="profile-section-heading">
                    <span class="profile-section-icon">${createIcon('bookmark')}</span>
                    <h4>Obras guardadas</h4>
                </div>
                ${renderSavedWorks(shelf, { compact: true })}
            </div>

            <div class="profile-section-block profile-section-block--compact">
                <p class="profile-muted">${summary.startedBooks} obras iniciadas · ${summary.savedQuotes} citas guardadas · ${summary.galleryItems} huellas</p>
            </div>
        </section>
    `;
}

function renderGallery(gallery) {
    const selectedItem = gallery.find((item) => item.id === selectedGalleryItemId) || gallery[0] || null;
    const firstImage = selectedItem?.image || '';

    return `
        <section class="profile-panel" data-panel="gallery">
            ${gallery.length === 0
                ? '<div class="profile-empty-inline"><p>No hay huellas guardadas.</p></div>'
                : `
                    <div class="profile-gallery-preview${firstImage ? ' profile-gallery-preview--visible' : ''}">
                        ${firstImage ? `<img id="profile-gallery-preview-img" src="${escapeHTML(firstImage)}" alt="Huella seleccionada">` : ''}
                    </div>
                    <div class="profile-gallery-grid">
                        ${gallery.map((item) => `
                            <article class="profile-gallery-item">
                                <button type="button" class="profile-gallery-thumb${item.id === selectedItem?.id ? ' profile-gallery-thumb--selected' : ''}" data-gallery-preview="${escapeHTML(item.id)}" aria-label="Ver huella">
                                    <img src="${escapeHTML(item.image)}" alt="">
                                </button>
                                <div class="profile-gallery-meta">
                                    <span>${escapeHTML(item.bookTitle || 'Huella')}</span>
                                    <button type="button" class="profile-gallery-delete" data-gallery-delete="${escapeHTML(item.id)}" aria-label="Eliminar huella">
                                        ${createIcon('trash')}
                                    </button>
                                </div>
                            </article>
                        `).join('')}
                    </div>
                    <button type="button" class="profile-action-btn profile-action-btn--ghost" id="profile-clear-gallery">Vaciar galería</button>
                `
            }
        </section>
    `;
}

function renderReadingSettings() {
    const controlState = getControlsState();
    const themeOptions = [
        ['dark', 'Oscuro'],
        ['sepia', 'Clásico'],
        ['light', 'Claro']
    ];

    return `
        <section class="profile-panel" data-panel="reading">
            <div class="profile-section-block">
                <div class="profile-section-heading">
                    <span class="profile-section-icon">${createIcon('sliders')}</span>
                    <h4>Apariencia</h4>
                </div>
                <div class="profile-theme-options">
                    ${themeOptions.map(([theme, label]) => `
                        <button type="button" class="profile-theme-option${controlState.currentTheme === theme ? ' profile-theme-option--active' : ''}" data-profile-theme="${theme}" aria-pressed="${controlState.currentTheme === theme}" aria-label="Tema ${label}">
                            <span class="profile-theme-swatch profile-theme-swatch--${theme}"></span>
                            <span>${label}</span>
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="profile-section-block">
                <div class="profile-control-row">
                    <div class="profile-control-label">
                        <span class="profile-section-icon">${createIcon('text')}</span>
                        <span>Tamaño de texto</span>
                    </div>
                    <div class="profile-stepper" aria-label="Tamaño de texto">
                        <button type="button" class="profile-stepper-btn" data-profile-font-delta="-0.1" aria-label="Reducir texto">${createIcon('minus')}</button>
                        <span id="profile-font-size-display" class="profile-control-value">${formatPercent(controlState.fontSize)}</span>
                        <button type="button" class="profile-stepper-btn" data-profile-font-delta="0.1" aria-label="Agrandar texto">${createIcon('plus')}</button>
                    </div>
                </div>
            </div>

            <div class="profile-section-block">
                <label class="profile-control-row profile-control-row--stacked" for="profile-volume-slider">
                    <span class="profile-control-label">
                        <span class="profile-section-icon">${createIcon('volume')}</span>
                        <span>Volumen</span>
                    </span>
                    <span id="profile-volume-display" class="profile-control-value">${formatPercent(controlState.currentVolume)}</span>
                </label>
                <input id="profile-volume-slider" class="profile-range" type="range" min="0" max="1" step="0.05" value="${escapeHTML(controlState.currentVolume)}" aria-label="Volumen">
            </div>

            <button type="button" class="profile-action-row" data-profile-fullscreen>
                <span class="profile-section-icon">${createIcon('maximize')}</span>
                <span>
                    <strong>Pantalla completa</strong>
                    <small>${controlState.isFullscreen ? 'Activa' : 'Inactiva'}</small>
                </span>
            </button>
        </section>
    `;
}

function renderAccount(user) {
    if (!user) {
        return `
            <section class="profile-panel" data-panel="account">
                <div class="profile-empty-inline">
                    <p>Sesión local activa.</p>
                    <button class="profile-action-btn profile-action-btn--primary" id="profile-login-btn">${createIcon('login')}Iniciar sesión</button>
                </div>
            </section>
        `;
    }

    return `
        <section class="profile-panel" data-panel="account">
            <form class="profile-settings-form" id="profile-settings-form">
                <label class="profile-settings-label" for="profile-display-name">Nombre visible</label>
                <input id="profile-display-name" class="profile-settings-input" type="text" value="${escapeHTML(user.displayName)}" maxlength="50" autocomplete="name">
                <button type="submit" class="profile-action-btn profile-action-btn--primary">Guardar cambios</button>
                <p class="profile-settings-error" id="profile-settings-error" role="alert" hidden></p>
            </form>
        </section>
    `;
}

function renderActivePanel({ user, summary, shelf, gallery }) {
    switch (activeProfileTab) {
        case 'gallery':
            return renderGallery(gallery);
        case 'reading':
            return renderReadingSettings();
        case 'account':
            return renderAccount(user);
        default:
            return renderOverview(summary, shelf, gallery);
    }
}

/**
 * Render drawer content based on current user
 */
function renderDrawerContent() {
    if (!drawerEl) return;
    const user = AuthService.getCurrentUser();
    const summary = getLocalReadingSummary();
    const shelf = getShelf();
    const gallery = getGallery();
    const displayName = user?.displayName || 'Lector invitado';
    const email = user?.email || 'Sesión local';
    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('es', { year: 'numeric', month: 'long' })
        : '';

    drawerEl.innerHTML = `
        <div class="profile-drawer-inner">
            <div class="profile-drawer-header">
                <div>
                    <span class="profile-drawer-eyebrow">Centro personal</span>
                    <h3>${escapeHTML(displayName)}</h3>
                </div>
                <button class="profile-drawer-close" aria-label="Cerrar centro personal">
                    ${createIcon('close')}
                </button>
            </div>

            <div class="profile-drawer-body">
                <div class="profile-avatar-section">
                    <div class="profile-avatar" style="background: ${user?.avatarColor || 'var(--color-accent-primary)'}">
                        ${user?.avatarUrl
                            ? `<img src="${escapeHTML(user.avatarUrl)}" alt="Avatar de ${escapeHTML(user.displayName)}" class="profile-avatar-img" />`
                            : `<span class="profile-avatar-initials">${escapeHTML(getInitials(displayName))}</span>`
                        }
                    </div>
                    <p class="profile-email">${escapeHTML(email)}</p>
                    ${memberSince ? `<p class="profile-member-since">Miembro desde ${escapeHTML(memberSince)}</p>` : ''}
                </div>

                <div class="profile-stats">
                    <div class="profile-stat">
                        <span class="profile-stat-value">${summary.startedBooks}</span>
                        <span class="profile-stat-label">Obras</span>
                    </div>
                    <div class="profile-stat">
                        <span class="profile-stat-value">${summary.pagesRead}</span>
                        <span class="profile-stat-label">Páginas</span>
                    </div>
                    <div class="profile-stat">
                        <span class="profile-stat-value">${summary.savedQuotes}</span>
                        <span class="profile-stat-label">Citas</span>
                    </div>
                    <div class="profile-stat">
                        <span class="profile-stat-value">${summary.galleryItems}</span>
                        <span class="profile-stat-label">Huellas</span>
                    </div>
                </div>

                ${renderTabs()}
                ${renderActivePanel({ user, summary, shelf, gallery })}

                <div class="profile-drawer-footer">
                    ${user
                        ? `<button class="profile-action-btn profile-action-btn--danger" id="profile-logout-btn">${createIcon('logout')}Cerrar sesión</button>`
                        : `<button class="profile-action-btn profile-action-btn--primary" id="profile-login-btn">${createIcon('login')}Iniciar sesión</button>`
                    }
                </div>
            </div>
        </div>
    `;
    bindDrawerEvents();
}

function bindDrawerEvents() {
    drawerEl.querySelector('.profile-drawer-close')?.addEventListener('click', closeDrawer);

    drawerEl.querySelectorAll('[data-profile-tab]').forEach((button) => {
        button.addEventListener('click', () => {
            activeProfileTab = button.dataset.profileTab;
            renderDrawerContent();
        });
    });

    drawerEl.querySelector('#profile-logout-btn')?.addEventListener('click', async () => {
        await AuthService.logout();
        activeProfileTab = 'home';
        closeDrawer();
    });

    drawerEl.querySelectorAll('#profile-login-btn').forEach((button) => {
        button.addEventListener('click', () => {
            closeDrawer();
            window.dispatchEvent(new CustomEvent('auth:show-login'));
        });
    });

    drawerEl.querySelector('#profile-settings-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const input = drawerEl.querySelector('#profile-display-name');
        const error = drawerEl.querySelector('#profile-settings-error');
        try {
            await AuthService.updateProfile({ displayName: input?.value || '' });
            activeProfileTab = 'account';
            renderDrawerContent();
        } catch (err) {
            if (error) {
                error.textContent = err.message;
                error.hidden = false;
            }
        }
    });

    drawerEl.querySelectorAll('[data-saved-remove]').forEach((button) => {
        button.addEventListener('click', () => {
            removeShelfBook(button.dataset.savedRemove);
            renderDrawerContent();
            window.dispatchEvent(new CustomEvent('profile:collections-updated'));
        });
    });

    drawerEl.querySelectorAll('[data-gallery-delete]').forEach((button) => {
        button.addEventListener('click', () => {
            removeFromGallery(button.dataset.galleryDelete);
            if (selectedGalleryItemId === button.dataset.galleryDelete) selectedGalleryItemId = null;
            activeProfileTab = 'gallery';
            renderDrawerContent();
            window.dispatchEvent(new CustomEvent('profile:collections-updated'));
        });
    });

    drawerEl.querySelector('#profile-clear-gallery')?.addEventListener('click', () => {
        clearGallery();
        selectedGalleryItemId = null;
        activeProfileTab = 'gallery';
        renderDrawerContent();
        window.dispatchEvent(new CustomEvent('profile:collections-updated'));
    });

    drawerEl.querySelectorAll('[data-gallery-preview]').forEach((button) => {
        button.addEventListener('click', () => {
            const item = getGallery().find((entry) => entry.id === button.dataset.galleryPreview);
            if (!item) return;
            selectedGalleryItemId = item.id;
            if (button.classList.contains('profile-mini-thumb')) {
                activeProfileTab = 'gallery';
                renderDrawerContent();
                return;
            }
            const previewImg = drawerEl.querySelector('#profile-gallery-preview-img');
            if (item?.image && previewImg) {
                previewImg.src = item.image;
                drawerEl.querySelectorAll('.profile-gallery-thumb--selected, .profile-mini-thumb--selected').forEach((thumb) => {
                    thumb.classList.remove('profile-gallery-thumb--selected', 'profile-mini-thumb--selected');
                });
                button.classList.add('profile-gallery-thumb--selected');
            }
        });
    });

    drawerEl.querySelectorAll('[data-profile-theme]').forEach((button) => {
        button.addEventListener('click', () => {
            const theme = button.dataset.profileTheme;
            if (!theme) return;
            profileControls.onThemeChange?.(theme);
            activeProfileTab = 'reading';
            renderDrawerContent();
        });
    });

    drawerEl.querySelectorAll('[data-profile-font-delta]').forEach((button) => {
        button.addEventListener('click', () => {
            const delta = Number(button.dataset.profileFontDelta);
            if (!Number.isFinite(delta)) return;
            profileControls.onFontSizeChange?.(delta);
            activeProfileTab = 'reading';
            renderDrawerContent();
        });
    });

    drawerEl.querySelector('#profile-volume-slider')?.addEventListener('input', (event) => {
        const value = Number(event.target.value);
        if (!Number.isFinite(value)) return;
        profileControls.onVolumeChange?.(value);
        const output = drawerEl.querySelector('#profile-volume-display');
        if (output) output.textContent = formatPercent(value);
    });

    drawerEl.querySelector('[data-profile-fullscreen]')?.addEventListener('click', () => {
        profileControls.onFullscreenToggle?.();
        window.setTimeout(() => {
            if (isOpen) renderDrawerContent();
        }, 120);
    });
}

window.addEventListener('profile:collections-updated', () => {
    if (isOpen) renderDrawerContent();
});

document.addEventListener('keydown', (event) => {
    if (!isOpen || event.key !== 'Escape') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeDrawer();
});

export function isDrawerOpen() {
    return isOpen;
}

/**
 * Open the profile drawer
 */
export function openDrawer() {
    try {
        if (!drawerEl) drawerEl = createDrawer();
        renderDrawerContent();
        isOpen = true;

        // Push state to history for coherent back navigation
        if (!window.history.state?.drawerOpen) {
            window.history.pushState({ ...window.history.state, drawerOpen: true }, '', '#profile');
        }

        drawerEl.classList.add('profile-drawer--open');
        drawerEl.setAttribute('aria-hidden', 'false');
        backdropEl?.classList.add('profile-drawer-backdrop--visible');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => {
            drawerEl?.querySelector('.profile-drawer-close')?.focus({ preventScroll: true });
        });
    } catch (err) {
        console.error('[UserProfile] Error opening drawer:', err);
    }
}

/**
 * Close the profile drawer
 */
export function closeDrawer(fromPopState = false) {
    if (!drawerEl || !isOpen) return;
    isOpen = false;
    
    const isFromPopState = fromPopState === true;
    if (!isFromPopState && window.history.state?.drawerOpen) {
        window.history.back();
    }

    drawerEl.classList.remove('profile-drawer--open');
    drawerEl.setAttribute('aria-hidden', 'true');
    backdropEl?.classList.remove('profile-drawer-backdrop--visible');
    document.body.style.overflow = '';
}

/**
 * Toggle the profile drawer
 */
export function toggleDrawer() {
    isOpen ? closeDrawer() : openDrawer();
}

/**
 * Create the avatar button for the header
 * @returns {HTMLButtonElement}
 */
export function createAvatarButton() {
    const btn = document.createElement('button');
    btn.id = 'user-avatar-btn';
    btn.className = 'header-action-btn header-action-btn--account header-avatar-btn';
    btn.setAttribute('aria-label', 'Abrir centro personal');
    btn.setAttribute('type', 'button');
    btn.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleDrawer();
    });
    updateAvatarButton(btn, AuthService.getCurrentUser());
    return btn;
}

/**
 * Update the avatar button appearance based on auth state
 * @param {HTMLButtonElement} btn
 * @param {Object|null} user
 */
export function updateAvatarButton(btn, user) {
    if (!btn) return;
    if (user) {
        btn.innerHTML = user.avatarUrl
            ? `<img src="${escapeHTML(user.avatarUrl)}" alt="" class="header-avatar-img" />`
            : `<span class="header-avatar-initials" style="background: ${user.avatarColor || 'var(--color-accent-primary)'}">${escapeHTML(getInitials(user.displayName))}</span>`;
        btn.title = 'Centro personal';
        btn.classList.add('header-avatar-btn--authenticated');
        btn.classList.remove('header-avatar-btn--guest');
    } else {
        btn.innerHTML = createIcon('user');
        btn.title = 'Centro personal';
        btn.classList.remove('header-avatar-btn--authenticated');
        btn.classList.add('header-avatar-btn--guest');
    }
}
