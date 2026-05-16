/**
 * AuthService — Facade pattern for user authentication.
 * 
 * Currently uses localStorage as a mock backend.
 * The public API is Promise-based, mirroring a real backend (Firebase/Supabase).
 * When a real backend is integrated, ONLY this file needs to change.
 * 
 * @module auth/AuthService
 */

const STORAGE_KEYS = {
    USERS_DB: 'li-users-db',
    SESSION: 'li-auth-session',
};

/** Minimum delay to simulate network latency (ms) */
const MOCK_DELAY = 400;

/**
 * Simulate async operation with realistic latency
 * @param {Function} fn 
 * @returns {Promise}
 */
function simulateAsync(fn) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                resolve(fn());
            } catch (err) {
                reject(err);
            }
        }, MOCK_DELAY + Math.random() * 200);
    });
}

/**
 * Read mock users database from localStorage
 * @returns {Object.<string, Object>} email→user map
 */
function readUsersDB() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.USERS_DB);
        return raw ? JSON.parse(raw) : {};
    } catch {
        localStorage.removeItem(STORAGE_KEYS.USERS_DB);
        return {};
    }
}

/**
 * Write mock users database to localStorage
 * @param {Object} db 
 */
function writeUsersDB(db) {
    localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(db));
}

/**
 * Generate a simple unique ID (mock)
 * @returns {string}
 */
function generateId() {
    return `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Simple password "hash" (base64 — NOT secure, just for mock)
 * Real backend would use bcrypt/argon2
 * @param {string} password 
 * @returns {string}
 */
function mockHash(password) {
    return btoa(password + '::li-salt');
}

/**
 * Sanitize user object for external consumption (strip sensitive fields)
 * @param {Object} internalUser 
 * @returns {Object}
 */
function sanitizeUser(internalUser) {
    if (!internalUser) return null;
    const { passwordHash, ...publicUser } = internalUser;
    return publicUser;
}

// ──────────────────────────────────────────────
// Validation Helpers
// ──────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string} [error]
 */

/**
 * Validate email format
 * @param {string} email 
 * @returns {ValidationResult}
 */
export function validateEmail(email) {
    if (!email || !email.trim()) return { valid: false, error: 'El correo es obligatorio' };
    if (!EMAIL_REGEX.test(email.trim())) return { valid: false, error: 'Formato de correo inválido' };
    return { valid: true };
}

/**
 * Validate password strength
 * @param {string} password 
 * @returns {ValidationResult}
 */
export function validatePassword(password) {
    if (!password) return { valid: false, error: 'La contraseña es obligatoria' };
    if (password.length < 6) return { valid: false, error: 'Mínimo 6 caracteres' };
    if (password.length > 128) return { valid: false, error: 'Máximo 128 caracteres' };
    return { valid: true };
}

/**
 * Validate display name
 * @param {string} name 
 * @returns {ValidationResult}
 */
export function validateName(name) {
    if (!name || !name.trim()) return { valid: false, error: 'El nombre es obligatorio' };
    if (name.trim().length < 2) return { valid: false, error: 'Mínimo 2 caracteres' };
    if (name.trim().length > 50) return { valid: false, error: 'Máximo 50 caracteres' };
    return { valid: true };
}

// ──────────────────────────────────────────────
// AuthService Singleton
// ──────────────────────────────────────────────

/** @type {Array<Function>} */
const authListeners = [];

/** @type {Object|null} */
let cachedUser = null;

/**
 * Notify all auth state change listeners
 * @param {Object|null} user 
 */
function notifyListeners(user) {
    cachedUser = user;
    authListeners.forEach(fn => {
        try { fn(user); } catch (e) { console.error('[AuthService] Listener error:', e); }
    });
}

/**
 * Save session to localStorage
 * @param {Object} user 
 */
function saveSession(user) {
    try {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({
            userId: user.id,
            email: user.email,
            timestamp: Date.now(),
        }));
    } catch { /* silently fail */ }
}

/**
 * Clear session from localStorage
 */
function clearSession() {
    try {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch { /* silently fail */ }
}

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

export const AuthService = {

    /**
     * Register a new user
     * @param {{ email: string, name: string, password: string }} data
     * @returns {Promise<Object>} The created user (sanitized)
     */
    async register({ email, name, password }) {
        return simulateAsync(() => {
            const emailVal = validateEmail(email);
            if (!emailVal.valid) throw new Error(emailVal.error);

            const nameVal = validateName(name);
            if (!nameVal.valid) throw new Error(nameVal.error);

            const passVal = validatePassword(password);
            if (!passVal.valid) throw new Error(passVal.error);

            const normalizedEmail = email.trim().toLowerCase();
            const db = readUsersDB();

            if (db[normalizedEmail]) {
                throw new Error('Ya existe una cuenta con este correo');
            }

            const newUser = {
                id: generateId(),
                email: normalizedEmail,
                displayName: name.trim(),
                avatarUrl: null,
                avatarColor: generateAvatarColor(),
                passwordHash: mockHash(password),
                createdAt: new Date().toISOString(),
                stats: {
                    booksRead: 0,
                    pagesRead: 0,
                    totalReadingTime: 0,
                    favoriteBooks: [],
                },
            };

            db[normalizedEmail] = newUser;
            writeUsersDB(db);

            const publicUser = sanitizeUser(newUser);
            saveSession(publicUser);
            notifyListeners(publicUser);

            return publicUser;
        });
    },

    /**
     * Login with email and password
     * @param {{ email: string, password: string }} data
     * @returns {Promise<Object>} The authenticated user (sanitized)
     */
    async login({ email, password }) {
        return simulateAsync(() => {
            const emailVal = validateEmail(email);
            if (!emailVal.valid) throw new Error(emailVal.error);

            if (!password) throw new Error('La contraseña es obligatoria');

            const normalizedEmail = email.trim().toLowerCase();
            const db = readUsersDB();
            const user = db[normalizedEmail];

            if (!user || user.passwordHash !== mockHash(password)) {
                throw new Error('Correo o contraseña incorrectos');
            }

            const publicUser = sanitizeUser(user);
            saveSession(publicUser);
            notifyListeners(publicUser);

            return publicUser;
        });
    },

    /**
     * Logout current user
     * @returns {Promise<void>}
     */
    async logout() {
        return simulateAsync(() => {
            clearSession();
            notifyListeners(null);
        });
    },

    /**
     * Get the currently authenticated user (from cache or session)
     * @returns {Object|null}
     */
    getCurrentUser() {
        if (cachedUser) return cachedUser;

        try {
            const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
            if (!raw) return null;

            const session = JSON.parse(raw);

            // Session expiry: 30 days
            const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
            if (Date.now() - session.timestamp > THIRTY_DAYS) {
                clearSession();
                return null;
            }

            const db = readUsersDB();
            const user = db[session.email];
            if (!user) {
                clearSession();
                return null;
            }

            cachedUser = sanitizeUser(user);
            return cachedUser;
        } catch {
            clearSession();
            return null;
        }
    },

    /**
     * Check if a user is currently authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return this.getCurrentUser() !== null;
    },

    /**
     * Update the current user's profile in the mock local database.
     * @param {{ displayName?: string, avatarUrl?: string|null }} updates
     * @returns {Promise<Object>} Updated user (sanitized)
     */
    async updateProfile(updates) {
        return simulateAsync(() => {
            const current = this.getCurrentUser();
            if (!current) throw new Error('No hay sesión activa');

            if (updates.displayName !== undefined) {
                const nameVal = validateName(updates.displayName);
                if (!nameVal.valid) throw new Error(nameVal.error);
            }

            const db = readUsersDB();
            const user = db[current.email];
            if (!user) throw new Error('Usuario no encontrado');

            if (updates.displayName !== undefined) user.displayName = updates.displayName.trim();
            if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl;

            db[current.email] = user;
            writeUsersDB(db);

            const publicUser = sanitizeUser(user);
            saveSession(publicUser);
            notifyListeners(publicUser);

            return publicUser;
        });
    },

    /**
     * Subscribe to authentication state changes
     * @param {Function} callback — receives (user|null)
     * @returns {Function} unsubscribe function
     */
    onAuthStateChange(callback) {
        authListeners.push(callback);
        const currentUser = this.getCurrentUser();
        try { callback(currentUser); } catch { /* noop */ }
        return () => {
            const idx = authListeners.indexOf(callback);
            if (idx !== -1) authListeners.splice(idx, 1);
        };
    },
};

/**
 * Generate a random avatar background color (OKLCH-based)
 * @returns {string}
 */
function generateAvatarColor() {
    const hues = [330, 200, 280, 145, 60, 25, 230]; // Match our design palette hues
    const hue = hues[Math.floor(Math.random() * hues.length)];
    return `oklch(65% 0.20 ${hue})`;
}
