/**
 * UserProfile — Drawer panel for user profile.
 * Shows avatar, stats, and prepared sections for gallery/comments/favorites.
 * @module auth/UserProfile
 */

import { AuthService } from './AuthService.js';

/** @type {HTMLElement|null} */
let drawerEl = null;

/** @type {HTMLElement|null} */
let backdropEl = null;

/** @type {boolean} */
let isOpen = false;

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
        .map(w => w[0].toUpperCase())
        .join('');
}

/**
 * Format reading time in hours/minutes
 * @param {number} minutes
 * @returns {string}
 */
function formatReadingTime(minutes) {
    if (!minutes || minutes < 1) return '0 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
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

/**
 * Render drawer content based on current user
 */
function renderDrawerContent() {
    if (!drawerEl) return;
    const user = AuthService.getCurrentUser();

    if (!user) {
        drawerEl.innerHTML = `
            <div class="profile-drawer-inner">
                <div class="profile-drawer-header">
                    <h3>Mi Perfil</h3>
                    <button class="profile-drawer-close" aria-label="Cerrar perfil">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div class="profile-drawer-body">
                    <div class="profile-empty">
                        <p>No has iniciado sesión</p>
                        <button class="profile-action-btn profile-action-btn--primary" id="profile-login-btn">Iniciar sesión</button>
                    </div>
                </div>
            </div>
        `;
        bindDrawerEvents();
        return;
    }

    const stats = user.stats || { booksRead: 0, pagesRead: 0, totalReadingTime: 0 };
    const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('es', { year: 'numeric', month: 'long' }) : '';

    drawerEl.innerHTML = `
        <div class="profile-drawer-inner">
            <div class="profile-drawer-header">
                <h3>Mi Perfil</h3>
                <button class="profile-drawer-close" aria-label="Cerrar perfil">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>

            <div class="profile-drawer-body">
                <div class="profile-avatar-section">
                    <div class="profile-avatar" style="background: ${user.avatarColor || 'var(--color-accent-primary)'}">
                        ${user.avatarUrl
                            ? `<img src="${user.avatarUrl}" alt="Avatar de ${user.displayName}" class="profile-avatar-img" />`
                            : `<span class="profile-avatar-initials">${getInitials(user.displayName)}</span>`
                        }
                    </div>
                    <h4 class="profile-name">${user.displayName}</h4>
                    <p class="profile-email">${user.email}</p>
                    ${memberSince ? `<p class="profile-member-since">Miembro desde ${memberSince}</p>` : ''}
                </div>

                <div class="profile-stats">
                    <div class="profile-stat">
                        <span class="profile-stat-icon">📚</span>
                        <span class="profile-stat-value">${stats.booksRead}</span>
                        <span class="profile-stat-label">Libros</span>
                    </div>
                    <div class="profile-stat">
                        <span class="profile-stat-icon">📄</span>
                        <span class="profile-stat-value">${stats.pagesRead}</span>
                        <span class="profile-stat-label">Páginas</span>
                    </div>
                    <div class="profile-stat">
                        <span class="profile-stat-icon">⏱️</span>
                        <span class="profile-stat-value">${formatReadingTime(stats.totalReadingTime)}</span>
                        <span class="profile-stat-label">Lectura</span>
                    </div>
                </div>

                <nav class="profile-menu" aria-label="Menú de perfil">
                    <button class="profile-menu-item" data-section="gallery" disabled>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <span>Mi Galería</span>
                        <span class="profile-menu-badge">Pronto</span>
                    </button>
                    <button class="profile-menu-item" data-section="comments" disabled>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span>Mis Comentarios</span>
                        <span class="profile-menu-badge">Pronto</span>
                    </button>
                    <button class="profile-menu-item" data-section="favorites" disabled>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        <span>Favoritos</span>
                        <span class="profile-menu-badge">Pronto</span>
                    </button>
                    <button class="profile-menu-item" data-section="settings" disabled>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        <span>Configuración</span>
                        <span class="profile-menu-badge">Pronto</span>
                    </button>
                </nav>

                <div class="profile-drawer-footer">
                    <button class="profile-action-btn profile-action-btn--danger" id="profile-logout-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </div>
    `;
    bindDrawerEvents();
}

function bindDrawerEvents() {
    // Close button
    drawerEl.querySelector('.profile-drawer-close')?.addEventListener('click', closeDrawer);

    // Logout
    drawerEl.querySelector('#profile-logout-btn')?.addEventListener('click', async () => {
        await AuthService.logout();
        closeDrawer();
    });

    // Login from empty state
    drawerEl.querySelector('#profile-login-btn')?.addEventListener('click', () => {
        closeDrawer();
        // Dispatch event so init.js can handle switching to auth view
        window.dispatchEvent(new CustomEvent('auth:show-login'));
    });
}

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
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
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
            ? `<img src="${user.avatarUrl}" alt="" class="header-avatar-img" />`
            : `<span class="header-avatar-initials" style="background: ${user.avatarColor || 'var(--color-accent-primary)'}">${getInitials(user.displayName)}</span>`;
        btn.title = user.displayName;
        btn.classList.add('header-avatar-btn--authenticated');
        btn.classList.remove('header-avatar-btn--guest');
    } else {
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
        `;
        btn.title = 'Iniciar sesión';
        btn.classList.remove('header-avatar-btn--authenticated');
        btn.classList.add('header-avatar-btn--guest');
    }
}
