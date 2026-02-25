import { state, themeColors, themeLabels } from '../app/state.js';
import { saveFontSize, saveTheme } from '../utils/storage.js';

export function applyTheme(themeName) {
    // Solo dark, sepia, light
    document.body.classList.remove('theme-light', 'theme-sepia', 'theme-dark');
    const className = `theme-${themeName}`;
    document.body.classList.add(className);

    const metaThemeColor = document.querySelector('meta[name=theme-color]');
    if (metaThemeColor && themeColors[themeName]) {
        metaThemeColor.setAttribute('content', themeColors[themeName]);
    }

    // Actualizar indicador visual del tema activo en settings panel
    updateThemeIndicator(themeName);
}

function updateThemeIndicator(themeName) {
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === themeName);
    });
}

export function cycleTheme() {
    const palette = state.appMode === 'reader' ? state.readerThemes : state.libraryThemes;
    let index = palette.indexOf(state.currentTheme);
    if (index === -1) index = 0;
    const nextIndex = (index + 1) % palette.length;
    state.currentTheme = palette[nextIndex];
    applyTheme(state.currentTheme);
    saveTheme(state.currentTheme);
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

    // Actualizar display del tamaño de fuente
    const fontDisplay = document.getElementById('font-size-display');
    if (fontDisplay) fontDisplay.textContent = `${Math.round(state.fontSize * 100)}%`;
}

export function toggleSettingsMenu(settingsMenu) {
    if (!settingsMenu) return;
    const isVisible = settingsMenu.classList.contains('visible');
    settingsMenu.classList.toggle('visible');

    // Actualizar estado visual cuando se abre
    if (!isVisible) {
        updateThemeIndicator(state.currentTheme);
        const fontDisplay = document.getElementById('font-size-display');
        if (fontDisplay) fontDisplay.textContent = `${Math.round(state.fontSize * 100)}%`;
    }
}

function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export function toggleFullscreen() {
    const doc = document;
    if (isIOS()) {
        const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
        if (!isStandalone) {
            alert("Para ver en pantalla completa real en iOS:\n\n1. Pulsa el botón 'Compartir' (cuadrado con flecha).\n2. Busca y selecciona 'Agregar a inicio'.\n\n¡Ábrela desde tu inicio y listo!");
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
