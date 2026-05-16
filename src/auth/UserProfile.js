/**
 * UserProfile — Drawer panel for profile, local shelf, drawings and settings.
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

/** @type {'overview'|'shelf'|'gallery'|'settings'} */
let activeProfileTab = 'overview';

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

function createIcon(name) {
    const icons = {
        close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
        login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>',
        logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
        trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>',
        user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
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
    drawer.setAttribute('aria-label', 'Perfil de usuario');
    drawer.setAttribute('aria-hidden', 'true');

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
        ['overview', 'Ecos'],
        ['shelf', 'Estante'],
        ['gallery', 'Galería'],
        ['settings', 'Cuenta']
    ];

    return `
        <nav class="profile-tabs" aria-label="Secciones de perfil">
            ${tabs.map(([id, label]) => `
                <button type="button" class="profile-tab${activeProfileTab === id ? ' profile-tab--active' : ''}" data-profile-tab="${id}" aria-selected="${activeProfileTab === id}">
                    ${label}
                </button>
            `).join('')}
        </nav>
    `;
}

function renderOverview(summary, shelf, gallery) {
    const latestShelf = shelf.slice(0, 2);
    const latestGallery = gallery.slice(0, 2);

    return `
        <section class="profile-panel" data-panel="overview">
            <div class="profile-section-block">
                <h4>Actividad reciente</h4>
                <div class="profile-echo-list">
                    ${latestShelf.length === 0 && latestGallery.length === 0
                        ? '<p class="profile-muted">Todavía no hay ecos guardados.</p>'
                        : ''}
                    ${latestShelf.map((book) => `
                        <div class="profile-echo-item">
                            <span class="profile-echo-kicker">Estante</span>
                            <strong>${escapeHTML(book.title)}</strong>
                            <span>${escapeHTML(book.author)}</span>
                        </div>
                    `).join('')}
                    ${latestGallery.map((item) => `
                        <div class="profile-echo-item">
                            <span class="profile-echo-kicker">Huella</span>
                            <strong>${escapeHTML(item.bookTitle || 'Dibujo guardado')}</strong>
                            <span>${formatDate(item.timestamp)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="profile-section-block profile-section-block--compact">
                <h4>Biblioteca personal</h4>
                <p class="profile-muted">${summary.startedBooks} lecturas iniciadas · ${summary.savedQuotes} citas guardadas</p>
            </div>
        </section>
    `;
}

function renderShelf(shelf) {
    return `
        <section class="profile-panel" data-panel="shelf">
            ${shelf.length === 0
                ? '<div class="profile-empty-inline"><p>Tu estante está vacío.</p></div>'
                : `<div class="profile-shelf-list">
                    ${shelf.map((book) => `
                        <article class="profile-shelf-item">
                            <div class="profile-shelf-cover">
                                ${book.cover ? `<img src="${escapeHTML(book.cover)}" alt="" loading="lazy">` : ''}
                            </div>
                            <div class="profile-shelf-copy">
                                <strong>${escapeHTML(book.title)}</strong>
                                <span>${escapeHTML(book.author)}</span>
                            </div>
                            <button type="button" class="profile-icon-action" data-shelf-remove="${escapeHTML(book.id)}" aria-label="Quitar del estante">
                                ${createIcon('trash')}
                            </button>
                        </article>
                    `).join('')}
                </div>`
            }
        </section>
    `;
}

function renderGallery(gallery) {
    const firstImage = gallery[0]?.image || '';

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
                                <button type="button" class="profile-gallery-thumb" data-gallery-preview="${escapeHTML(item.id)}" aria-label="Ver huella">
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

function renderSettings(user) {
    if (!user) {
        return `
            <section class="profile-panel" data-panel="settings">
                <div class="profile-empty-inline">
                    <p>Inicia sesión para editar tu perfil.</p>
                    <button class="profile-action-btn profile-action-btn--primary" id="profile-login-btn">Iniciar sesión</button>
                </div>
            </section>
        `;
    }

    return `
        <section class="profile-panel" data-panel="settings">
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
        case 'shelf':
            return renderShelf(shelf);
        case 'gallery':
            return renderGallery(gallery);
        case 'settings':
            return renderSettings(user);
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
                <h3>Mi Perfil</h3>
                <button class="profile-drawer-close" aria-label="Cerrar perfil">
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
                    <h4 class="profile-name">${escapeHTML(displayName)}</h4>
                    <p class="profile-email">${escapeHTML(email)}</p>
                    ${memberSince ? `<p class="profile-member-since">Miembro desde ${escapeHTML(memberSince)}</p>` : ''}
                </div>

                <div class="profile-stats">
                    <div class="profile-stat">
                        <span class="profile-stat-value">${summary.startedBooks}</span>
                        <span class="profile-stat-label">Lecturas</span>
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
            activeProfileTab = 'settings';
            renderDrawerContent();
        } catch (err) {
            if (error) {
                error.textContent = err.message;
                error.hidden = false;
            }
        }
    });

    drawerEl.querySelectorAll('[data-shelf-remove]').forEach((button) => {
        button.addEventListener('click', () => {
            removeShelfBook(button.dataset.shelfRemove);
            activeProfileTab = 'shelf';
            renderDrawerContent();
            window.dispatchEvent(new CustomEvent('profile:collections-updated'));
        });
    });

    drawerEl.querySelectorAll('[data-gallery-delete]').forEach((button) => {
        button.addEventListener('click', () => {
            removeFromGallery(button.dataset.galleryDelete);
            activeProfileTab = 'gallery';
            renderDrawerContent();
        });
    });

    drawerEl.querySelector('#profile-clear-gallery')?.addEventListener('click', () => {
        clearGallery();
        activeProfileTab = 'gallery';
        renderDrawerContent();
    });

    drawerEl.querySelectorAll('[data-gallery-preview]').forEach((button) => {
        button.addEventListener('click', () => {
            const item = getGallery().find((entry) => entry.id === button.dataset.galleryPreview);
            const previewImg = drawerEl.querySelector('#profile-gallery-preview-img');
            if (item?.image && previewImg) previewImg.src = item.image;
        });
    });
}

window.addEventListener('profile:collections-updated', () => {
    if (isOpen) renderDrawerContent();
});

/**
 * Open the profile drawer
 */
export function openDrawer() {
    try {
        if (!drawerEl) drawerEl = createDrawer();
        renderDrawerContent();
        isOpen = true;
        drawerEl.classList.add('profile-drawer--open');
        drawerEl.setAttribute('aria-hidden', 'false');
        backdropEl?.classList.add('profile-drawer-backdrop--visible');
        document.body.style.overflow = 'hidden';
    } catch (err) {
        console.error('[UserProfile] Error opening drawer:', err);
    }
}

/**
 * Close the profile drawer
 */
export function closeDrawer() {
    if (!drawerEl || !isOpen) return;
    isOpen = false;
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
    btn.className = 'header-avatar-btn';
    btn.setAttribute('aria-label', 'Perfil de usuario');
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
        btn.title = user.displayName;
        btn.classList.add('header-avatar-btn--authenticated');
        btn.classList.remove('header-avatar-btn--guest');
    } else {
        btn.innerHTML = createIcon('user');
        btn.title = 'Perfil local';
        btn.classList.remove('header-avatar-btn--authenticated');
        btn.classList.add('header-avatar-btn--guest');
    }
}
