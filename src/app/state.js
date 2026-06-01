// ============================================================
// STATE.JS — Estado global observable (v2.0)
//
// El objeto `state` funciona exactamente igual que antes para
// todos los módulos: puedes leer y mutar state.X directamente.
//
// La novedad: ahora el estado AVISA cuando algo cambia.
// Cualquier módulo puede suscribirse así:
//
//   state.on('appMode', (newValue, oldValue) => { ... });
//   state.off('appMode', handler);   // Cancelar suscripción
//   state.once('currentBook', handler); // Solo la primera vez
//
// Esto elimina la necesidad de recordar manualmente "cuando
// cambia X, actualiza también Y" — el sistema lo hace solo.
// ============================================================

// ---- Datos internos del observador ----
const _listeners = new Map();  // Map<key, Set<Function>>
const _rawState = {
    appMode: 'library',
    currentBook: null,
    // Auth state
    currentUser: null,
    isAuthenticated: false,
    authView: 'login', // 'login' | 'register' | 'forgot-password'
    story: null,
    storyIndex: null,  // Map<pageId, pageData> — índice O(1)
    currentStoryId: -1,
    pageHistory: [],
    fontSize: 1.2,
    currentTheme: 'dark',
    // Orden: Negro (default) → Sepia (rosado clásico) → Claro (blanco limpio)
    readerThemes: ['dark', 'sepia', 'light'],
    libraryThemes: ['dark'],
    isTransitioning: false,
    currentAudio: null,
    currentAudioFile: null,
    currentAudioBaseVolume: 1,
    currentAudioPageId: null,
    currentAudioPageData: null,
    currentVolume: 1,
    totalPagesInStory: 0,
    karaokeInterval: null,
    audioStatus: 'idle',
    audioStatusMessage: '',
    audioBookDecisions: {},
    audioUserActivated: false,
    audioVolumeTouched: false,
    // Datos efímeros de sesión (juegos, puntuaciones temporales)
    // No se persisten en localStorage — se limpian al cambiar de libro
    ephemeral: {}
};

/** Notifica a todos los suscriptores de una clave concreta */
function _notify(key, newValue, oldValue) {
    if (newValue === oldValue) return;
    const handlers = _listeners.get(key);
    if (!handlers || handlers.size === 0) return;
    handlers.forEach(fn => {
        try {
            fn(newValue, oldValue);
        } catch (err) {
            console.error(`[state] Error en suscriptor de "${key}":`, err);
        }
    });
}

/** Proxy que intercepta todas las mutaciones directas */
export const state = new Proxy(_rawState, {
    set(target, key, value) {
        const old = target[key];
        target[key] = value;
        _notify(key, value, old);
        return true;
    },

    // Las funciones del observador viven en el Proxy como métodos virtuales
    get(target, key) {
        // --- API del observador ---
        if (key === 'on') {
            return function on(propKey, handler) {
                if (!_listeners.has(propKey)) _listeners.set(propKey, new Set());
                _listeners.get(propKey).add(handler);
                return handler; // Devuelve la referencia para poder hacer .off()
            };
        }

        if (key === 'off') {
            return function off(propKey, handler) {
                _listeners.get(propKey)?.delete(handler);
            };
        }

        if (key === 'once') {
            return function once(propKey, handler) {
                const wrapper = (newVal, oldVal) => {
                    state.off(propKey, wrapper);
                    handler(newVal, oldVal);
                };
                state.on(propKey, wrapper);
                return wrapper;
            };
        }

        // --- Acceso normal a propiedades ---
        return target[key];
    }
});

// ============================================================
// CONSTANTES DE TEMAS (sin cambios)
// ============================================================
export const themeColors = {
    dark: '#1a1a1a',
    sepia: '#f4ecd8',
    light: '#ffffff'
};

export const themeLabels = {
    dark: 'Oscuro',
    sepia: 'Clásico',
    light: 'Claro'
};

// ============================================================
// HELPERS DE MUTACIÓN — Compatibilidad con código existente
// Siguen funcionando igual que antes.
// ============================================================

export const setFontSize = (value) => {
    state.fontSize = value;  // El Proxy notifica automáticamente
};

export const setCurrentTheme = (value) => {
    state.currentTheme = value;
};

export const setCurrentVolume = (value) => {
    state.currentVolume = value;
};

export const getAppMode = () => state.appMode;
