import { state, themeColors } from '../app/state.js';
import { saveFontSize, saveTheme } from '../utils/storage.js';

export function applyTheme(themeName) {
    document.body.classList.remove('theme-light', 'theme-sepia', 'theme-dark');
    document.body.classList.add(`theme-${themeName}`);

    const metaThemeColor = document.querySelector('meta[name=theme-color]');
    if (metaThemeColor && themeColors[themeName]) {
        metaThemeColor.setAttribute('content', themeColors[themeName]);
    }
}

export function selectTheme(themeName) {
    if (!state.readerThemes.includes(themeName)) return;
    state.currentTheme = themeName;
    applyTheme(state.currentTheme);
    saveTheme(state.currentTheme);
}

export function changeFontSize(delta) {
    state.fontSize = Math.max(0.8, Math.min(1.8, state.fontSize + delta));
    document.documentElement.style.setProperty('--font-size-dynamic', `${state.fontSize}rem`);
    saveFontSize(state.fontSize);
}

function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export function toggleFullscreen() {
    const doc = document;
    if (isIOS()) {
        const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
        if (!isStandalone) {
            alert("Para ver en pantalla completa real en iOS:\n\n1. Pulsa el botón 'Compartir' (cuadrado con flecha).\n2. Busca y selecciona 'Agregar a inicio'.\n\nÁbrela desde tu inicio y listo.");
            return;
        }
        return;
    }

    if (!doc.fullscreenElement) {
        doc.documentElement.requestFullscreen().catch((err) => {
            console.warn('Fullscreen API falló, activando modo CSS fallback:', err);
            document.body.classList.toggle('fullscreen-mode');
        });
    } else {
        doc.exitFullscreen();
    }
}
