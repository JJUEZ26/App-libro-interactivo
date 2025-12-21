import { createLibrary } from '../books/index.js';
import { setLibraryDependencies, openBook, switchToLibraryView } from '../library/view.js';
import { loadStory } from '../reader/story.js';
import { setRenderDependencies, renderPage, resetScrollPosition } from '../reader/render.js';
import {
    closeNav,
    goBack,
    goForward,
    goToPage,
    openNav,
    restartStory,
    setNavigationDependencies
} from '../reader/navigation.js';
import { loadPreferences, saveVolume } from '../utils/storage.js';
import { applyTheme, changeFontSize, cycleTheme, toggleFullscreen, toggleSettingsMenu } from '../ui/index.js';
import { getEl } from './dom.js';
import { setCurrentTheme, setCurrentVolume, setFontSize, state } from './state.js';

export function initApp() {
    console.log('Iniciando Lecturas Interactivas v4.2 (Corrección Audio & Estilos)');

    const elements = {
        appContainer: getEl('app-container'),
        libraryView: getEl('library-view'),
        libraryHero: getEl('library-hero'),
        librarySections: getEl('library-sections'),
        readerView: getEl('reader-view'),
        book: getEl('book'),
        pageWrapper: getEl('page-wrapper'),
        mainTitle: getEl('main-title'),
        backToLibraryBtn: getEl('back-to-library'),
        increaseFontBtn: getEl('increase-font'),
        decreaseFontBtn: getEl('decrease-font'),
        themeSelectorBtn: getEl('theme-selector'),
        settingsToggle: getEl('settings-toggle'),
        settingsMenu: getEl('settings-menu'),
        fullscreenBtn: getEl('fullscreen-btn'),
        volumeSlider: getEl('volume-slider'),
        navToggle: getEl('nav-toggle'),
        navModal: getEl('nav-modal'),
        navClose: getEl('nav-close'),
        restartBtn: getEl('restart-btn'),
        historyList: getEl('history-list'),
        progressBar: getEl('progress-bar'),
        appFooter: getEl('app-footer')
    };

    setLibraryDependencies({ elements, loadStory, goToPage });
    setRenderDependencies({ elements, goToPage });
    setNavigationDependencies({ elements, renderPage, resetScrollPosition, switchToLibraryView });

    const library = createLibrary({
        libraryHero: elements.libraryHero,
        librarySections: elements.librarySections,
        openBook
    });

    if (elements.backToLibraryBtn) {
        elements.backToLibraryBtn.addEventListener('click', () => {
            switchToLibraryView();
        });
    }

    if (elements.volumeSlider) {
        elements.volumeSlider.addEventListener('input', (event) => {
            state.currentVolume = parseFloat(event.target.value);
            if (state.currentAudio) state.currentAudio.volume = state.currentVolume;
            saveVolume(state.currentVolume);
        });
    }

    if (elements.book) {
        elements.book.addEventListener('click', (event) => {
            if (state.appMode !== 'reader') return;
            if (state.isTransitioning) return;
            if (
                event.target.closest('.choices') ||
                event.target.closest('button') ||
                event.target.closest('.karaoke-line') ||
                event.target.closest('.audio-controls-container')
            ) {
                return;
            }

            const rect = elements.book.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            if (clickX < rect.width * 0.3) goBack();
            else goForward();
        });

        let touchStartX = 0;
        let touchStartY = 0;
        elements.book.addEventListener(
            'touchstart',
            (event) => {
                if (state.appMode !== 'reader') return;
                if (state.isTransitioning) return;
                const touch = event.changedTouches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
            },
            { passive: true }
        );

        elements.book.addEventListener(
            'touchend',
            (event) => {
                if (state.appMode !== 'reader') return;
                if (state.isTransitioning) return;
                if (
                    event.target.closest('.choices') ||
                    event.target.closest('button') ||
                    event.target.closest('.karaoke-line') ||
                    event.target.closest('.audio-controls-container')
                ) {
                    return;
                }

                const touch = event.changedTouches[0];
                const deltaX = touch.clientX - touchStartX;
                const deltaY = touch.clientY - touchStartY;
                const absDeltaX = Math.abs(deltaX);
                const absDeltaY = Math.abs(deltaY);
                if (absDeltaX < 50 || absDeltaX < absDeltaY) return;
                if (deltaX < 0) goForward();
                else goBack();
            },
            { passive: true }
        );
    }

    if (elements.navToggle) elements.navToggle.addEventListener('click', openNav);
    if (elements.navClose) elements.navClose.addEventListener('click', closeNav);
    if (elements.restartBtn) elements.restartBtn.addEventListener('click', restartStory);
    if (elements.navModal) {
        elements.navModal.addEventListener('click', (event) => {
            if (event.target === elements.navModal) closeNav();
        });
    }

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            document.body.classList.add('fullscreen-mode');
            resetScrollPosition();
        } else {
            document.body.classList.remove('fullscreen-mode');
            resetScrollPosition();
        }
    });

    if (elements.increaseFontBtn) {
        elements.increaseFontBtn.addEventListener('click', () => changeFontSize(0.1));
    }
    if (elements.decreaseFontBtn) {
        elements.decreaseFontBtn.addEventListener('click', () => changeFontSize(-0.1));
    }
    if (elements.themeSelectorBtn) {
        elements.themeSelectorBtn.addEventListener('click', cycleTheme);
    }
    if (elements.settingsToggle) {
        elements.settingsToggle.addEventListener('click', () => toggleSettingsMenu(elements.settingsMenu));
    }
    if (elements.fullscreenBtn) {
        elements.fullscreenBtn.addEventListener('click', toggleFullscreen);
    }

    async function initializeApp() {
        loadPreferences({
            readerThemes: state.readerThemes,
            libraryThemes: state.libraryThemes,
            applyTheme,
            volumeSlider: elements.volumeSlider,
            setFontSize,
            setCurrentTheme,
            setCurrentVolume
        });
        switchToLibraryView();
        await library.loadBooks();
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }

    initializeApp();
}
