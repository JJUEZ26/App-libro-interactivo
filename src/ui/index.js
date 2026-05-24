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
    const isVirtual = document.body.classList.contains('virtual-fullscreen');

    if (isVirtual) {
        document.body.classList.remove('virtual-fullscreen');
        document.dispatchEvent(new Event('fullscreenchange'));
        return;
    }

    const hasNativeFs = !!(doc.documentElement.requestFullscreen || 
                           doc.documentElement.webkitRequestFullscreen || 
                           doc.documentElement.msRequestFullscreen);
    const useVirtual = isIOS() || !hasNativeFs;

    if (useVirtual) {
        document.body.classList.add('virtual-fullscreen');
        document.dispatchEvent(new Event('fullscreenchange'));
        return;
    }

    const activeNativeFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement);
    if (!activeNativeFs) {
        const requestFs = doc.documentElement.requestFullscreen || 
                          doc.documentElement.webkitRequestFullscreen || 
                          doc.documentElement.msRequestFullscreen;
        if (requestFs) {
            requestFs.call(doc.documentElement).catch((err) => {
                console.warn('Native Fullscreen API failed, falling back to Virtual Fullscreen:', err);
                document.body.classList.add('virtual-fullscreen');
                document.dispatchEvent(new Event('fullscreenchange'));
            });
        } else {
            document.body.classList.add('virtual-fullscreen');
            document.dispatchEvent(new Event('fullscreenchange'));
        }
    } else {
        const exitFs = doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
        if (exitFs) {
            exitFs.call(doc);
        }
    }
}
